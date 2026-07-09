BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events_registration') THEN
        TRUNCATE TABLE public.events_registration RESTART IDENTITY CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events_event') THEN
        TRUNCATE TABLE public.events_event RESTART IDENTITY CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events_user') THEN
        TRUNCATE TABLE public.events_user RESTART IDENTITY CASCADE;
    END IF;
END $$;

-- 1) Table des utilisateurs (compatible avec le modèle Django custom User)
CREATE TABLE IF NOT EXISTS events_user (
    id BIGSERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMPTZ,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    email VARCHAR(254) NOT NULL DEFAULT '',
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) NOT NULL DEFAULT 'participant',
    phone VARCHAR(20) DEFAULT '',
    organization_name VARCHAR(255) DEFAULT ''
);

-- 2) Table des événements
CREATE TABLE IF NOT EXISTS events_event (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    date DATE NOT NULL,
    time TIME,
    location VARCHAR(255) NOT NULL,
    venue VARCHAR(255) DEFAULT '',
    image VARCHAR(500) DEFAULT '',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    allowed_users JSONB NOT NULL DEFAULT '[]'::jsonb,
    places INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    price_currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
    organizer_id BIGINT NOT NULL REFERENCES events_user(id) ON DELETE CASCADE,
    views_count INTEGER NOT NULL DEFAULT 0,
    registrations_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3) Table des inscriptions
CREATE TABLE IF NOT EXISTS events_registration (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events_event(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL REFERENCES events_user(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, participant_id)
);

-- 4) Données initiales des utilisateurs
INSERT INTO events_user (
    id, username, password, first_name, last_name, email, role, organization_name, is_staff, is_superuser
) VALUES
(1, 'organizer', 'changeme', 'Eventify', 'Sénégal', 'organizer@eventify.dev', 'organizer', 'Eventify Sénégal', TRUE, TRUE),
(2, 'aminata.diop', 'changeme', 'Aminata', 'Diop', 'aminata.diop@exemple.com', 'participant', '', FALSE, FALSE),
(3, 'moussa.fall', 'changeme', 'Moussa', 'Fall', 'moussa.fall@exemple.com', 'participant', '', FALSE, FALSE),
(4, 'fatou.ndiaye', 'changeme', 'Fatou', 'Ndiaye', 'fatou.ndiaye@exemple.com', 'participant', '', FALSE, FALSE),
(5, 'ibrahima.sarr', 'changeme', 'Ibrahima', 'Sarr', 'ibrahima.sarr@exemple.com', 'participant', '', FALSE, FALSE),
(6, 'marieme.ba', 'changeme', 'Marième', 'Ba', 'marieme.ba@exemple.com', 'participant', '', FALSE, FALSE);

-- 5) Données initiales des événements (alignées avec le frontend)
INSERT INTO events_event (
    id, title, description, category, date, time, location, venue, image, is_public,
    allowed_users, places, price, price_currency, organizer_id, views_count,
    registrations_count, status
) VALUES
(1, 'Festival Sabar & Percussions',
 'Une nuit de percussions traditionnelles et de sonorités modernes avec les meilleurs artistes sénégalais.',
 'Musique', '2026-08-24', '20:00:00', 'Dakar', 'Corniche de Dakar',
 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', TRUE,
 '[]'::jsonb, 200, 10000, 'FCFA', 1, 1240, 45, 'published'),
(2, 'Masterclass IA & Développement Web',
 'Une immersion pratique dans l''IA générative et les frameworks web modernes.',
 'Atelier', '2026-09-12', '10:00:00', 'Dakar', 'Ker Xaleyi, Dakar',
 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600', TRUE,
 '[]'::jsonb, 150, 0, 'FCFA', 1, 890, 120, 'published'),
(3, 'Soirée Thiéboudienne : Dîner Gastronomique',
 'Un menu dégustation revisitant les classiques de la cuisine sénégalaise.',
 'Gastronomie', '2026-09-05', '19:30:00', 'Saint-Louis', 'Restaurant La Teranga, Saint-Louis',
 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', TRUE,
 '[]'::jsonb, 80, 25000, 'FCFA', 1, 654, 32, 'published'),
(4, 'Exposition Perspectives Contemporaines',
 'Une collection d''œuvres d''artistes sénégalais émergents explorant l''identité et la modernité.',
 'Arts', '2026-10-01', '11:00:00', 'Dakar', 'Village des Arts, Dakar',
 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600', TRUE,
 '[]'::jsonb, 100, 0, 'FCFA', 1, 432, 18, 'published');

-- 6) Données initiales des inscriptions
INSERT INTO events_registration (id, event_id, participant_id, status) VALUES
(1, 1, 2, 'confirmed'),
(2, 1, 3, 'confirmed'),
(3, 1, 4, 'pending'),
(4, 2, 5, 'confirmed'),
(5, 2, 6, 'waitlist');

-- 7) Optionnel : afficher un résumé
SELECT 'Tables créées et données insérées avec succès' AS status;
