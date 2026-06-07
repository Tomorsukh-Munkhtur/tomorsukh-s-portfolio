# Supabase тохиргооны заавар

Энэ төсөл одоо өгөгдлөө (төсөл, ангилал, зурвас) Supabase database-д,
зургийг Supabase Storage-д хадгална. Доорх алхмуудыг дагана уу.

## 1. Supabase project үүсгэх

1. https://supabase.com → "Start your project" → бүртгүүлэх (GitHub-ээр болно).
2. "New project" → нэр, нууц үг (database password) өгөөд бүс (region) сонгох.
   Бүсээ ойрхон газар (жишээ нь Singapore) сонгох нь хурдан.
3. Project бэлэн болтол ~2 минут хүлээнэ.

## 2. Database хүснэгтүүд үүсгэх

Supabase Dashboard → зүүн талын **SQL Editor** → доорх кодыг буулгаад **Run** дарна:

```sql
-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  image_url text,
  images jsonb default '[]'::jsonb,
  featured boolean default false,
  created_at timestamptz default now()
);

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table projects enable row level security;
alter table categories enable row level security;
alter table messages enable row level security;

-- Projects: хүн бүр уншиж/бичиж болно (хувийн портфолио)
create policy "projects_public_read"  on projects for select using (true);
create policy "projects_public_write" on projects for all    using (true) with check (true);

-- Categories: хүн бүр уншиж/бичиж болно
create policy "categories_public_read"  on categories for select using (true);
create policy "categories_public_write" on categories for all    using (true) with check (true);

-- Messages: хүн бүр ИЛГЭЭЖ (insert) болно, гэхдээ УНШИХ боломжгүй.
-- Унших/устгахыг зөвхөн сервер (service-role) хийнэ → имэйл алдагдахгүй.
create policy "messages_public_insert" on messages for insert with check (true);

-- Анхдагч ангиллууд
insert into categories (name) values
  ('Веб дизайн'),
  ('Мобайл дизайн'),
  ('Дижитал зураг'),
  ('Веб систем'),
  ('Лого'),
  ('Брэндбүүк');
```

## 3. Storage bucket үүсгэх

1. Dashboard → **Storage** → **New bucket**.
2. Нэр: `project-images` (яг ингэж бичих — код үүнийг хайна).
3. **Public bucket** -г **ON** болгоно (зочид зураг харах ёстой).
4. Create дарна.

## 4. API түлхүүрүүд авах

Dashboard → **Project Settings** (доод зүүн) → **API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key (нууц! битгий хэнд ч өг) → `SUPABASE_SERVICE_ROLE_KEY`

## 5. Локал орчинд тохируулах

Төслийн үндсэн хавтаст `.env.local` нэртэй файл үүсгээд доорхийг бичнэ
(`.env.local.example`-г хуулж болно):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=Asingiro8!
```

> `ADMIN_PASSWORD` нь `app/lib/auth.ts` доторх нууц үгтэй ЯГ адил байх ёстой.

Дараа нь:

```
npm run dev
```

http://localhost:3000 нээж шалгана.

## 6. Vercel дээр тохируулах

1. Vercel → төслөө сонгох → **Settings** → **Environment Variables**.
2. Дээрх 4 хувьсагчийг (URL, ANON_KEY, SERVICE_ROLE_KEY, ADMIN_PASSWORD)
   нэг бүрчлэн нэмнэ. Production, Preview, Development бүгдэд нь идэвхжүүлнэ.
3. **Deployments** → хамгийн сүүлийн deploy → **Redeploy** (env-ийг уншихын тулд
   дахин deploy хийх шаардлагатай).

## Анхаарах зүйл (аюулгүй байдал)

- Нэвтрэлт нь client-side бөгөөд нууц үг кодонд байгаа тул жинхэнэ хамгаалалт биш.
  Ирээдүйд **Supabase Auth** руу шилжвэл төсөл/ангилал бичих эрхийг зөвхөн
  нэвтэрсэн админд олгож, илүү найдвартай болно.
- Зурвасын имэйл хаягууд хамгаалагдсан (зөвхөн сервер талаас уншина).
