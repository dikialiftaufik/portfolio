-- Portfolio seed — Task 1.
-- Values copied VERBATIM from js/content.js (commit c6cff1a). Do not improvise.
-- Stable ids keep E2E deterministic. Re-runnable (upsert on id).

-- ------------------------------------------------------------- projects
insert into public.projects
  (id, title, tagline, description, tech, image, github_link, sort_order)
values
  ('11111111-1111-4111-8111-111111111111',
   'BOLOOO',
   'Platform berbasis Website Pemesanan Makanan dan Reservasi Tempat',
   'Developed collaboratively by a team of three for a university final project, this web application was built following comprehensive user research including interviews, questionnaires, and journey mapping, and features a secure database architecture that implements password hashing and SQL injection prevention.',
   array['HTML','PHP','CSS','JavaScript'],
   'assets/images/projects/boloo-food-order.png',
   'https://github.com/dikialiftaufik/tubes-webpro',
   0),
  ('22222222-2222-4222-8222-222222222222',
   'The Komar''s',
   'Platform berbasis Website untuk Manajemen Pesanan dan Reservasi Restoran',
   'Developed as a collaborative final project for Web Application Development, this system facilitates comprehensive restaurant management including menu ordering and table reservation. The application utilizes a robust relational database architecture with Laravel and MySQL to ensure data integrity and efficient transaction processing for daily operations.',
   array['Laravel','MySQL','Bootstrap'],
   'assets/images/projects/the-komars.png',
   'https://github.com/dikialiftaufik/tubes-pabw',
   1),
  ('33333333-3333-4333-8333-333333333333',
   'PPDB Online',
   'Platform berbasis Website Penerimaan Peserta Didik Baru',
   'Developed individually as a final project for my vocational high school competency exam, this online student admission system utilizes Laravel, Bootstrap and MySQL to streamline the registration process and allows administrators to manage and verify applicant data efficiently.',
   array['Laravel','Bootstrap','MySQL'],
   'assets/images/projects/ppdb-online.png',
   'https://github.com/diki130704/ppdb-online',
   2)
on conflict (id) do update set
  title = excluded.title, tagline = excluded.tagline,
  description = excluded.description, tech = excluded.tech,
  image = excluded.image, github_link = excluded.github_link,
  sort_order = excluded.sort_order, updated_at = now();

-- --------------------------------------------------------- certificates
insert into public.certificates
  (id, title, issuer, date_label, image, sort_order)
values
  ('a1111111-1111-4111-8111-111111111111',
   'InnovAItion: AI Skilling for Young Workers',
   'Plan International', 'Oct 2025',
   'assets/images/certs/cert-innovaiition-plan-2025.jpg', 0),
  ('a2222222-2222-4222-8222-222222222222',
   'Electives AI Training',
   'Generation Girl', 'Dec 2025',
   'assets/images/certs/cert-electives-ai-2025.png', 1),
  ('a3333333-3333-4333-8333-333333333333',
   'Java (Basic)',
   'HackerRank', 'Jan 2026',
   'assets/images/certs/cert-java-basic-hackerrank.png', 2),
  ('a4444444-4444-4444-8444-444444444444',
   'UX Design Introduction Job Simulation',
   'Lloyds Banking Group', 'Jan 2026',
   'assets/images/certs/cert-uxd-intro-lloyds.png', 3),
  ('a5555555-5555-4555-8555-555555555555',
   'UX Design Advanced Job Simulation',
   'Lloyds Banking Group', 'Jan 2026',
   'assets/images/certs/cert-uxd-advanced-lloyds.png', 4),
  ('a6666666-6666-4666-8666-666666666666',
   'Java Programming for Beginners',
   'Simplilearn', 'Jan 2026',
   'assets/images/certs/cert-java-beginners-simplilearn.png', 5),
  ('a7777777-7777-4777-8777-777777777777',
   'EPrT (English Proficiency Test)',
   'Lac', 'Oct 2024',
   'assets/images/certs/cert-eprt-2024.jpg', 6)
on conflict (id) do update set
  title = excluded.title, issuer = excluded.issuer,
  date_label = excluded.date_label, image = excluded.image,
  sort_order = excluded.sort_order, updated_at = now();

-- ------------------------------------------------------------ tech_stack
insert into public.tech_stack (id, name, icon, sort_order)
values
  ('b0000001-0000-4000-8000-000000000001', 'HTML5', 'devicon-html5-plain', 0),
  ('b0000002-0000-4000-8000-000000000002', 'CSS3', 'devicon-css3-plain', 1),
  ('b0000003-0000-4000-8000-000000000003', 'JavaScript', 'devicon-javascript-plain', 2),
  ('b0000004-0000-4000-8000-000000000004', 'Bootstrap', 'devicon-bootstrap-plain', 3),
  ('b0000005-0000-4000-8000-000000000005', 'Tailwind', 'devicon-tailwindcss-original', 4),
  ('b0000006-0000-4000-8000-000000000006', 'Java', 'devicon-java-plain', 5),
  ('b0000007-0000-4000-8000-000000000007', 'PHP', 'devicon-php-plain', 6),
  ('b0000008-0000-4000-8000-000000000008', 'Python', 'devicon-python-plain', 7),
  ('b0000009-0000-4000-8000-000000000009', 'Laravel', 'devicon-laravel-original', 8),
  ('b0000010-0000-4000-8000-000000000010', 'React', 'devicon-react-original', 9),
  ('b0000011-0000-4000-8000-000000000011', 'MySQL', 'devicon-mysql-plain', 10),
  ('b0000012-0000-4000-8000-000000000012', 'Oracle', 'devicon-oracle-original', 11),
  ('b0000013-0000-4000-8000-000000000013', 'MongoDB', 'devicon-mongodb-plain', 12),
  ('b0000014-0000-4000-8000-000000000014', 'Flutter', 'devicon-flutter-plain', 13),
  ('b0000015-0000-4000-8000-000000000015', 'Google Colab', 'devicon-googlecolab-plain', 14),
  ('b0000016-0000-4000-8000-000000000016', 'GitHub', 'devicon-github-original', 15),
  ('b0000017-0000-4000-8000-000000000017', 'WordPress', 'devicon-wordpress-plain', 16),
  ('b0000018-0000-4000-8000-000000000018', 'Figma', 'devicon-figma-plain', 17)
on conflict (id) do update set
  name = excluded.name, icon = excluded.icon,
  sort_order = excluded.sort_order;

-- Expected after run: 3 projects, 7 certificates, 18 tech_stack, 0 messages.
