// Настройки подключения к Supabase — заполняются один раз после создания
// проекта на supabase.com (Project Settings → API).
//
// Сюда идут ТОЛЬКО открытые (публичные) значения — Project URL и anon
// public key. Они и так видны в браузере любого пользователя приложения,
// это нормально и предусмотрено самим Supabase. А вот значение
// "service_role" (secret) сюда класть НЕЛЬЗЯ НИКОГДА — это ключ полного
// доступа в обход всех прав, ему тут не место.
window.SUPABASE_CONFIG = {
  url: 'https://nctwdjyxlwnsbdkmisje.supabase.co',
  anonKey: 'sb_publishable_S0ruXCX_UXlIkPAboUlAPg_SYP72WVi'
};
