#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  Видео на платформе, этап 1: нарезка mp4 в HLS и загрузка в Cloud.ru.
#
#  Запуск (из любой папки):
#    tools/video/hls-upload.sh запись.mp4 tire-1-5-razbor
#    tools/video/hls-upload.sh запись.mp4 tire-1-5-razbor --chapters главы.txt
#    tools/video/hls-upload.sh запись.mp4 tire-1-5-razbor --no-upload   # только нарезка
#
#  На выходе: master.m3u8 + три качества (1080p ~2,5 Мбит/с, 720p ~1,2,
#  360p ~0,5), постер poster.jpg, длительность в секундах, готовая запись
#  для video-links.js и публичная ссылка на master.m3u8.
#
#  Почему так:
#  - Нарезка кладётся ВНЕ репозитория (~/Movies/mathh-video/...): mp4 и
#    сегменты весят сотни мегабайт, в git им не место.
#  - Каждая загрузка идёт в свою папку <slug>/<дата-время>/. Адрес новый,
#    поэтому плейлистам и сегментам можно дать долгий кэш: браузер и
#    провайдер никогда не покажут старый кусок вместо нового, а трафик
#    (бесплатные 10 ТБ в месяц) не тратится на повторные скачивания.
#    Перезалили ролик — в video-links.js меняется hls_url, и всё.
#  - Ключ доступа читается из ~/.config/mathh-video/credentials и только
#    оттуда: в репозиторий и в аргументы командной строки (их видно в ps и
#    в истории shell) он не попадает.
#
#  Файл ключа (права 600), две строки:
#    CLOUDRU_KEY_ID=<Key ID из консоли>
#    CLOUDRU_KEY_SECRET=<Key Secret из консоли>
#  Логин для S3 скрипт собирает сам: <ID тенанта>:<Key ID>.
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail
# В русской локали дробная часть пишется через запятую: printf не понимал
# «30.000000» от ffprobe, а awk отдал бы ffmpeg время постера «3,00».
# Числа считаем в английской локали; UTF-8 оставляем ради русских имён файлов.
export LC_ALL=en_US.UTF-8

# Это не секреты: имя бакета, эндпоинт и ID тенанта видны в публичных ссылках
# и в консоли. Секрет — только Key Secret, он живёт в файле ключа.
BUCKET="mathh-video"
ENDPOINT="https://s3.cloud.ru"
REGION="ru-central-1"
TENANT_ID="2b4b975b-7fbb-44a7-bce1-ed6c32826a50"
PUBLIC_BASE="https://mathh-video.s3.cloud.ru"
CRED_FILE="${MATHH_VIDEO_CREDENTIALS:-$HOME/.config/mathh-video/credentials}"
OUT_ROOT="${MATHH_VIDEO_OUT:-$HOME/Movies/mathh-video}"
# Сайт, с которого плеер грузит видео: им проверяем CORS после загрузки
SITE_ORIGIN="https://dan-tutor-math.github.io"

SEG_SECONDS=4   # 4 с: быстрый старт и перемотка; 6 с дали бы меньше запросов, но дольше ждать первого кадра
FPS=30          # запись доски: 30 кадров хватает почерку, 60 только удвоили бы объём

die()  { printf '\n✖ %s\n' "$*" >&2; exit 1; }
info() { printf '• %s\n' "$*"; }

usage() {
  sed -n '4,12p' "$0" | sed 's/^#  \{0,1\}//'
  exit "${1:-0}"
}

# ── аргументы ──────────────────────────────────────────────────────────
INPUT=""; SLUG=""; CHAPTERS=""; UPLOAD=1
while [ $# -gt 0 ]; do
  case "$1" in
    --chapters) CHAPTERS="${2:-}"; shift 2 ;;
    --no-upload) UPLOAD=0; shift ;;
    -h|--help) usage 0 ;;
    -*) die "Неизвестный ключ: $1" ;;
    *) if [ -z "$INPUT" ]; then INPUT="$1"; elif [ -z "$SLUG" ]; then SLUG="$1"; else die "Лишний аргумент: $1"; fi; shift ;;
  esac
done
[ -n "$INPUT" ] && [ -n "$SLUG" ] || usage 1
[ -f "$INPUT" ] || die "Нет файла: $INPUT"
# slug идёт в путь объекта и в ключ localStorage плеера: только латиница,
# цифры и дефис, чтобы ссылка не превращалась в %D0%... и не ломалась
printf '%s' "$SLUG" | grep -Eq '^[a-z0-9][a-z0-9-]{1,63}$' \
  || die "slug — латиница в нижнем регистре, цифры и дефис, например tire-1-5-razbor"
if [ -n "$CHAPTERS" ] && [ ! -f "$CHAPTERS" ]; then die "Нет файла глав: $CHAPTERS"; fi

# ── инструменты ────────────────────────────────────────────────────────
need_brew() {
  # $1 — команда, $2 — пакет brew
  command -v "$1" >/dev/null 2>&1 && return 0
  if command -v brew >/dev/null 2>&1; then
    die "Не найден $1. Поставьте: brew install $2"
  fi
  die "Не найден $1 и нет Homebrew. Сначала Homebrew (https://brew.sh), потом: brew install $2"
}
need_brew ffmpeg ffmpeg
need_brew ffprobe ffmpeg
# ffmpeg без libx264 бывает в урезанных сборках — без него нет H.264, а
# другой кодек iPhone в HLS не проиграет
ffmpeg -hide_banner -encoders 2>/dev/null | grep -q libx264 \
  || die "ffmpeg собран без libx264. Переустановите: brew reinstall ffmpeg"
if [ "$UPLOAD" = 1 ]; then
  need_brew aws awscli
fi

# ── ключ доступа ───────────────────────────────────────────────────────
read_cred() {
  # Файл не исполняем через source: читаем только нужную строку, чтобы
  # случайный текст в файле не выполнился как команда
  grep -E "^$1=" "$CRED_FILE" | head -n1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'
}
if [ "$UPLOAD" = 1 ]; then
  [ -f "$CRED_FILE" ] || die "Нет файла ключа $CRED_FILE. Как создать — tools/video/README.md, раздел «Ключ доступа»"
  perm="$(stat -f '%Lp' "$CRED_FILE" 2>/dev/null || stat -c '%a' "$CRED_FILE")"
  if [ "$perm" != "600" ] && [ "$perm" != "400" ]; then
    die "У файла ключа права $perm — его могут читать другие. Выполните: chmod 600 \"$CRED_FILE\""
  fi
  KEY_ID="$(read_cred CLOUDRU_KEY_ID)"
  KEY_SECRET="$(read_cred CLOUDRU_KEY_SECRET)"
  [ -n "$KEY_ID" ] && [ -n "$KEY_SECRET" ] || die "В $CRED_FILE нужны строки CLOUDRU_KEY_ID=… и CLOUDRU_KEY_SECRET=…"
fi

# ── исходник ───────────────────────────────────────────────────────────
probe() { ffprobe -v error "$@" "$INPUT"; }
SRC_H="$(probe -select_streams v:0 -show_entries stream=height -of csv=p=0 | head -n1)"
[ -n "$SRC_H" ] || die "В файле нет видеодорожки"
HAS_AUDIO="$(probe -select_streams a:0 -show_entries stream=index -of csv=p=0 | head -n1)"
DUR_RAW="$(probe -show_entries format=duration -of csv=p=0)"
DURATION="$(printf '%.0f' "$DUR_RAW")"
[ "$DURATION" -ge 1 ] || die "Не удалось узнать длительность"

# Качества: высота, потолок битрейта, CRF. Капнутый CRF, а не постоянный
# битрейт: доска почти всё время стоит на месте, и кодер тратит на неё в
# разы меньше потолка. Потолок (maxrate) держит пики, когда пишем быстро.
# Потолок же ffmpeg пишет в BANDWIDTH master.m3u8 — по нему плеер выбирает
# качество. Выше исходника не растягиваем: 1080p из 720p — те же пиксели
# за двойной трафик.
ALL_VARIANTS="1080:2500:22 720:1200:23 360:500:24"
VARIANTS=""
for v in $ALL_VARIANTS; do
  h="${v%%:*}"
  if [ "$h" -le "$SRC_H" ] || [ "$h" = 360 ]; then VARIANTS="$VARIANTS $v"; fi
done
VARIANTS="${VARIANTS# }"

VERSION="$(date +%Y%m%d-%H%M%S)"
OUT="$OUT_ROOT/$SLUG/$VERSION"
mkdir -p "$OUT"
info "Исходник: $(basename "$INPUT"), ${SRC_H}p, ${DURATION} с"
info "Качества: $(for v in $VARIANTS; do printf '%sp ' "${v%%:*}"; done)"
info "Папка нарезки: $OUT"

# ── нарезка ────────────────────────────────────────────────────────────
# Один проход ffmpeg на все качества: исходник декодируется один раз,
# ключевые кадры у всех качеств в одни и те же моменты — плеер переключает
# качество на границе сегмента без рывка.
GOP=$((FPS * SEG_SECONDS))
FILTER="[0:v]fps=${FPS},split=$(echo $VARIANTS | wc -w | tr -d ' ')"
i=0; for v in $VARIANTS; do FILTER="$FILTER[s$i]"; i=$((i + 1)); done
MAPS=(); STREAM_MAP=""
i=0
for v in $VARIANTS; do
  IFS=: read -r h rate crf <<EOF
$v
EOF
  # lanczos — чёткие тонкие линии почерка при уменьшении; -2 — чётная ширина
  FILTER="$FILTER;[s$i]scale=-2:${h}:flags=lanczos,format=yuv420p[v$i]"
  MAPS+=(-map "[v$i]")
  MAPS+=("-crf:v:$i" "$crf" "-maxrate:v:$i" "${rate}k" "-bufsize:v:$i" "$((rate * 2))k")
  if [ -n "$HAS_AUDIO" ]; then
    MAPS+=(-map 0:a:0)
    STREAM_MAP="$STREAM_MAP v:$i,a:$i,name:${h}p"
  else
    STREAM_MAP="$STREAM_MAP v:$i,name:${h}p"
  fi
  i=$((i + 1))
done

# Настройки x264 под запись доски:
#  - tune animation: большие ровные заливки и резкие края (как в мультиках) —
#    меньше «мыла» вокруг линий, больше опорных кадров для неподвижного фона;
#  - preset slow: нарезка один раз, смотрят сотни раз — время кодера дешевле
#    трафика;
#  - профиль high, уровень 4.1: проигрывают все iPhone и Android последних лет;
#  - GOP ровно на сегмент, scenecut 0 и force_key_frames — каждый сегмент
#    начинается с ключевого кадра, иначе HLS режет не по 4 с и перемотка
#    промахивается.
ffmpeg -hide_banner -loglevel warning -stats -y -i "$INPUT" \
  -filter_complex "$FILTER" \
  "${MAPS[@]}" \
  -c:v libx264 -preset slow -tune animation -profile:v high -level:v 4.1 \
  -g "$GOP" -keyint_min "$GOP" -sc_threshold 0 \
  -force_key_frames "expr:gte(t,n_forced*${SEG_SECONDS})" \
  -c:a aac -b:a 96k -ac 2 -ar 48000 \
  -f hls -hls_time "$SEG_SECONDS" -hls_playlist_type vod \
  -hls_flags independent_segments \
  -hls_segment_type mpegts \
  -hls_segment_filename "$OUT/%v/seg_%04d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "${STREAM_MAP# }" \
  "$OUT/%v/index.m3u8"

[ -f "$OUT/master.m3u8" ] || die "ffmpeg не создал master.m3u8"

# Постер — кадр из 10 % ролика (в первую секунду на доске обычно пусто),
# 720p jpg: показывается до нажатия «▶» и не должен весить как сегмент
POSTER_AT="$(awk -v d="$DUR_RAW" 'BEGIN{t=d*0.1; if(t>30)t=30; printf "%.2f", t}')"
ffmpeg -hide_banner -loglevel error -y -ss "$POSTER_AT" -i "$INPUT" -frames:v 1 \
  -vf "scale=-2:'min(720,ih)':flags=lanczos" -q:v 3 "$OUT/poster.jpg"

# ── главы ──────────────────────────────────────────────────────────────
# Файл глав: строки «м:сс Название» или «ч:мм:сс Название». Без файла —
# главы из самого mp4, если они там есть (их ставит, например, Final Cut).
CHAPTERS_JS="[]"
if [ -n "$CHAPTERS" ]; then
  CHAPTERS_JS="$(awk '
    /^[[:space:]]*$/ { next }
    {
      n = split($1, p, ":"); t = 0
      for (k = 1; k <= n; k++) t = t * 60 + p[k]
      $1 = ""; sub(/^[[:space:]]+/, ""); gsub(/\\/, "\\\\"); gsub(/'\''/, "\\'\''")
      out = out (out == "" ? "" : ", ") "{ t: " t ", title: '\''" $0 "'\'' }"
    }
    END { print "[" out "]" }' "$CHAPTERS")"
else
  CH="$(probe -show_chapters -of csv=p=0 2>/dev/null | awk -F, '
    NF >= 6 { t = int($4 + 0.5); title = $NF; gsub(/'\''/, "\\'\''", title)
              out = out (out == "" ? "" : ", ") "{ t: " t ", title: '\''" title "'\'' }" }
    END { print "[" out "]" }')"
  [ -n "$CH" ] && CHAPTERS_JS="$CH"
fi

SIZE="$(du -sh "$OUT" | cut -f1)"
info "Нарезано: $SIZE"

KEY_PREFIX="$SLUG/$VERSION"
HLS_URL="$PUBLIC_BASE/$KEY_PREFIX/master.m3u8"
POSTER_URL="$PUBLIC_BASE/$KEY_PREFIX/poster.jpg"

# ── загрузка ───────────────────────────────────────────────────────────
if [ "$UPLOAD" = 1 ]; then
  export AWS_ACCESS_KEY_ID="$TENANT_ID:$KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$KEY_SECRET"
  export AWS_DEFAULT_REGION="$REGION"
  # Свежий aws cli (с 2.23) сам добавляет к загрузке контрольные суммы
  # CRC32 в новом формате, а S3-совместимые хранилища их часто не понимают
  # и отвечают ошибкой. Считаем суммы, только когда их требует сервер.
  export AWS_REQUEST_CHECKSUM_CALCULATION=when_required
  export AWS_RESPONSE_CHECKSUM_VALIDATION=when_required
  # Чужой профиль aws (например, рабочий) не должен подмешаться к этому
  unset AWS_PROFILE AWS_SESSION_TOKEN
  S3="aws s3 cp --endpoint-url $ENDPOINT --only-show-errors"
  DEST="s3://$BUCKET/$KEY_PREFIX"
  # Папка версии новая при каждой загрузке — содержимое по адресу не
  # меняется никогда, поэтому кэш на год и immutable
  CACHE="public, max-age=31536000, immutable"

  info "Загрузка в $DEST …"
  # Content-Type ставим сами по расширению: без него hls.js получает
  # binary/octet-stream, Safari на iPhone такой плейлист не играет вовсе
  $S3 --recursive "$OUT" "$DEST" --exclude '*' --include '*.m3u8' \
    --content-type 'application/vnd.apple.mpegurl' --cache-control "$CACHE"
  $S3 --recursive "$OUT" "$DEST" --exclude '*' --include '*.ts' \
    --content-type 'video/mp2t' --cache-control "$CACHE"
  $S3 "$OUT/poster.jpg" "$DEST/poster.jpg" \
    --content-type 'image/jpeg' --cache-control "$CACHE"

  # Проверяем то, на чём обычно спотыкаемся: файл отдаётся анонимно, тип
  # правильный, CORS пускает сайт. Тот же запрос, что сделает hls.js.
  HDRS="$(curl -sS -I -H "Origin: $SITE_ORIGIN" "$HLS_URL" || true)"
  CODE="$(printf '%s' "$HDRS" | head -n1 | awk '{print $2}')"
  CTYPE="$(printf '%s' "$HDRS" | grep -i '^content-type:' | tr -d '\r' | cut -d' ' -f2-)"
  ACAO="$(printf '%s' "$HDRS" | grep -i '^access-control-allow-origin:' | tr -d '\r' | cut -d' ' -f2-)"
  [ "$CODE" = 200 ] || info "⚠ master.m3u8 отвечает $CODE, а не 200 — проверьте публичный доступ бакета"
  [ "$CTYPE" = "application/vnd.apple.mpegurl" ] || info "⚠ Content-Type master.m3u8: «$CTYPE»"
  if [ -z "$ACAO" ]; then
    info "⚠ Нет Access-Control-Allow-Origin для $SITE_ORIGIN — проверьте CORS бакета"
  fi
else
  info "Загрузка пропущена (--no-upload). Ссылки ниже станут рабочими после загрузки этой папки."
fi

# ── итог ───────────────────────────────────────────────────────────────
cat <<EOF

════════════════════════════════════════════════════════════════
 master.m3u8: $HLS_URL
 Длительность: $DURATION с
 Постер:      $POSTER_URL
════════════════════════════════════════════════════════════════
Запись для video-links.js (videos), title и kind поправьте:

  { slug: '$SLUG', title: '…', kind: 'razbor', duration: $DURATION,
    hls_url: '$HLS_URL',
    poster_url: '$POSTER_URL',
    chapters: $CHAPTERS_JS },
EOF
