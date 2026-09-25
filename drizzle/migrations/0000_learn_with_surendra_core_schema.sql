-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ CATALOG ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10,2),
  discount_percentage INT NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  file_path TEXT,
  page_count INT,
  file_size TEXT,
  format TEXT NOT NULL DEFAULT 'PDF',
  tags TEXT[] NOT NULL DEFAULT '{}',
  learn_points TEXT[] NOT NULL DEFAULT '{}',
  includes TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  sales_count INT NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_published_idx ON public.products(is_published);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "products admin read" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.product_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  page_label TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX product_previews_product_idx ON public.product_previews(product_id);
GRANT SELECT ON public.product_previews TO anon, authenticated;
GRANT ALL ON public.product_previews TO service_role;
ALTER TABLE public.product_previews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "previews public read" ON public.product_previews FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_published)
);
CREATE POLICY "previews admin write" ON public.product_previews FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ COUPONS ============
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(10,2),
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons admin all" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupon_usage TO authenticated;
GRANT ALL ON public.coupon_usage TO service_role;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon usage own read" ON public.coupon_usage FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  coupon_code TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders(user_id);
CREATE INDEX orders_status_idx ON public.orders(status);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "orders own read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  title_snapshot TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
CREATE INDEX order_items_user_idx ON public.order_items(user_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items own read" ON public.order_items FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  method TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON public.payments(order_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments own read" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  ip_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX downloads_user_idx ON public.downloads(user_id);
GRANT SELECT ON public.downloads TO authenticated;
GRANT ALL ON public.downloads TO service_role;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "downloads own read" ON public.downloads FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ REVIEWS / WISHLIST / NOTIFICATIONS ============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_name TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
CREATE INDEX reviews_product_idx ON public.reviews(product_id);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "reviews own read" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews insert purchasers" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id = reviews.product_id AND oi.user_id = auth.uid() AND o.status = 'paid'
  )
);
CREATE POLICY "reviews own update" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews admin all" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist own all" ON public.wishlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications own read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications own update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SEED ============
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Java','java','Core Java, OOP, collections and the modern Java ecosystem',1),
  ('DSA','dsa','Data structures and algorithms with worked dry runs',2),
  ('Database','database','SQL, DBMS, indexing and query design',3),
  ('Core CS','core-cs','Operating systems, computer networks and theory',4),
  ('Backend','backend','Spring Boot, microservices and API design',5),
  ('Interview Prep','interview-prep','Interview question banks and system design',6);

INSERT INTO public.products (title, slug, short_description, description, category_id, price, compare_at_price, discount_percentage, page_count, file_size, tags, learn_points, includes, requirements, rating, review_count, sales_count, is_free, is_featured, is_bestseller, is_published) VALUES
('Java Complete Notes','java-complete-notes','150+ pages covering OOP, collections, streams and multithreading.','A complete, exam-ready Java reference covering object-oriented design, collections, generics, multithreading, streams and the modern Java ecosystem. Written for B.Tech and MCA students who want one source of truth for both semester exams and first-round interviews.',(SELECT id FROM public.categories WHERE slug='java'),99,199,50,152,'12 MB','{java,oop,collections,streams}','{"Core OOP and design patterns in Java","Collections, generics and concurrency","Streams, lambdas and Java 17 features","Interview-ready problem sets with solutions"}','{"152 indexed pages","Revision cheat-sheets","Lifetime updates","Instant PDF download"}','{"Basic programming familiarity"}',4.9,312,1840,false,true,true,true),
('Java 8 Interview Notes','java-8-interview-notes','Every Java 8 question interviewers actually ask, with crisp answers.','Focused preparation material for Java 8: lambdas, functional interfaces, streams, Optional, default methods and the new date-time API — each topic paired with the exact questions asked in service-based and product-based interviews.',(SELECT id FROM public.categories WHERE slug='java'),79,149,47,86,'7 MB','{java,java8,interview}','{"Lambdas and functional interfaces","Stream pipelines and collectors","Optional and null-safety patterns","120+ interview questions with answers"}','{"86 pages","Quick revision tables","Lifetime updates"}','{"Basic Java syntax"}',4.8,204,960,false,true,true,true),
('DSA in Java','dsa-in-java','120+ pages from arrays to graphs with dry runs and patterns.','A pattern-first data structures and algorithms handbook in Java. Each chapter builds from intuition to implementation to complexity analysis, then gives you the interview problems that use that pattern.',(SELECT id FROM public.categories WHERE slug='dsa'),149,249,40,128,'11 MB','{dsa,algorithms,java}','{"Arrays, strings and two-pointer patterns","Trees, tries and graph traversals","Dynamic programming decision tables","Time and space complexity reasoning"}','{"128 pages","Pattern index","300+ practice problems","Lifetime updates"}','{"Comfort with Java basics"}',4.8,189,1240,false,true,true,true),
('SQL Complete Notes','sql-complete-notes','90+ pages from basic queries to joins, indexing and tuning.','Learn SQL the way it is used at work: querying, joining, aggregating, window functions, indexing strategy and reading query plans. Includes a practice set modelled on real reporting requirements.',(SELECT id FROM public.categories WHERE slug='database'),0,NULL,0,94,'6 MB','{sql,database,queries}','{"SELECT, filtering and aggregation","All join types with worked examples","Window functions and subqueries","Indexes and query plans"}','{"94 pages","Practice query set","Free forever"}','{}',4.7,540,4300,true,true,false,true),
('DBMS Notes','dbms-notes','Normalization, transactions and indexing for semester exams.','A semester-ready DBMS companion: ER modelling, relational algebra, normalization up to BCNF, transactions, concurrency control and recovery — written in exam-answer format so you can reproduce it under time pressure.',(SELECT id FROM public.categories WHERE slug='database'),79,129,39,110,'8 MB','{dbms,normalization,transactions}','{"ER modelling and relational algebra","Normal forms up to BCNF","ACID, isolation levels and locking","Previous-year exam answer patterns"}','{"110 pages","Exam answer templates","Lifetime updates"}','{}',4.6,146,720,false,false,false,true),
('Operating System Notes','operating-system-notes','Processes, scheduling, memory and deadlocks made intuitive.','Operating systems explained through diagrams and numerical problems: process scheduling, synchronization, deadlock handling, memory management and virtual memory, plus the numericals that show up in exams and interviews.',(SELECT id FROM public.categories WHERE slug='core-cs'),79,149,47,104,'9 MB','{os,scheduling,memory}','{"Process states and CPU scheduling","Synchronization and classic problems","Deadlock detection and avoidance","Paging, segmentation and virtual memory"}','{"104 pages","Solved numericals","Lifetime updates"}','{}',4.7,168,810,false,false,true,true),
('Computer Networks Notes','computer-networks-notes','OSI to TCP/IP, routing and security essentials.','A layered walk through computer networks: physical to application layer, TCP vs UDP behaviour, routing algorithms, subnetting practice and the security basics every developer is expected to know.',(SELECT id FROM public.categories WHERE slug='core-cs'),79,139,43,98,'8 MB','{networks,tcp,routing}','{"OSI and TCP/IP layer responsibilities","TCP flow and congestion control","Routing algorithms and subnetting","HTTP, DNS and TLS basics"}','{"98 pages","Subnetting practice sheet","Lifetime updates"}','{}',4.6,132,640,false,false,false,true),
('Spring Boot Notes','spring-boot-notes','Build production REST APIs with Spring Boot, JPA and security.','Practical Spring Boot: dependency injection, REST controllers, validation, JPA and Hibernate mapping, transactions, Spring Security with JWT, testing and deployment — structured as a build-along reference.',(SELECT id FROM public.categories WHERE slug='backend'),149,249,40,140,'13 MB','{spring,springboot,rest,jpa}','{"Dependency injection and auto-configuration","REST APIs with validation and error handling","JPA, Hibernate and transactions","Spring Security with JWT"}','{"140 pages","Sample project walkthrough","Lifetime updates"}','{"Java fundamentals"}',4.9,221,1120,false,true,true,true),
('Microservices Notes','microservices-notes','Service boundaries, communication patterns and resilience.','Microservices without the hype: decomposition strategy, synchronous vs event-driven communication, API gateways, service discovery, distributed transactions with saga, observability and the failure modes to plan for.',(SELECT id FROM public.categories WHERE slug='backend'),199,299,33,132,'12 MB','{microservices,architecture,resilience}','{"Service decomposition and boundaries","REST, messaging and event-driven flows","Saga, idempotency and consistency","Resilience, tracing and monitoring"}','{"132 pages","Architecture diagrams","Lifetime updates"}','{"Backend API experience"}',4.8,97,430,false,false,false,true),
('System Design Notes','system-design-notes','Scalable design fundamentals with 12 full case studies.','From load balancing and caching to sharding, queues and CAP trade-offs — followed by twelve full case studies (URL shortener, news feed, chat, payments, rate limiter and more) with capacity estimates and diagrams.',(SELECT id FROM public.categories WHERE slug='interview-prep'),199,349,43,168,'15 MB','{"system design",scalability,interview}','{"Load balancing, caching and CDNs","Databases, sharding and replication","Queues, streams and consistency models","12 end-to-end design case studies"}','{"168 pages","12 case studies","Capacity estimation sheets","Lifetime updates"}','{"Basic backend knowledge"}',4.9,178,760,false,true,true,true),
('DSA Interview Cheat Sheet','dsa-interview-cheat-sheet','A free 20-page pattern sheet for last-minute revision.','The one-sheet revision companion: every major DSA pattern, its trigger conditions, template code and the classic problems it solves. Print it the night before your interview.',(SELECT id FROM public.categories WHERE slug='interview-prep'),0,NULL,0,22,'2 MB','{dsa,cheatsheet,interview,free}','{"Pattern triggers at a glance","Template code per pattern","Complexity quick table"}','{"22 pages","Printable format","Free forever"}','{}',4.8,392,3100,true,false,false,true),
('Java Interview Question Bank','java-interview-question-bank','500 curated Java interview questions with model answers.','Five hundred Java interview questions sorted by difficulty and topic, each with a model answer written the way an interviewer wants to hear it — plus follow-up questions so you are ready for the second layer.',(SELECT id FROM public.categories WHERE slug='interview-prep'),49,99,51,74,'6 MB','{java,interview,questions}','{"500 questions by topic and difficulty","Model answers with follow-ups","Common mistakes to avoid"}','{"74 pages","Topic-wise index","Lifetime updates"}','{}',4.7,263,1580,false,false,false,true);

INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, expires_at, is_active) VALUES
  ('WELCOME20','percentage',20,99,100,500, now() + interval '180 days', true),
  ('STUDENT50','fixed',50,149,NULL,200, now() + interval '90 days', true);
