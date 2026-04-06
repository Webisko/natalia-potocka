import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

const productsToSeed = [
    {
        id: uuidv4(),
        title: 'Testowy Kurs: Wprowadzenie do świadomości',
        slug: 'testowy-kurs',
        description: 'Przykładowy kurs wideo, który był wcześniej w Cockpicie. Zawiera wszystkie niezbędne moduły i lekcje testowe.',
        price: 199.00,
        stripe_price_id: 'price_test_course',
        type: 'video',
        content_url: 'https://vimeo.com/123456789',
        thumbnail_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        meta_title: 'Testowy Kurs - Natalia Potocka',
        meta_desc: 'To jest testowy kurs wideo.'
    },
    {
        id: uuidv4(),
        title: 'Medytacja Poranna (Test)',
        slug: 'medytacja-poranna',
        description: 'Medytacja audio z poprzedniego systemu. Pozwoli Ci zacząć dzień w spokoju i równowadze.',
        price: 49.00,
        stripe_price_id: 'price_test_meditation',
        type: 'audio',
        content_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        thumbnail_url: 'https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        meta_title: 'Medytacja Poranna - Natalia Potocka',
        meta_desc: 'Testowa medytacja poranna.'
    },
    {
        id: uuidv4(),
        title: 'Zpis z Webinaru: Radzenie sobie ze stresem',
        slug: 'webinar-stres',
        description: 'Zapis naszego 2-godzinnego webinaru o radzeniu sobie z codziennym stresem i przebodźcowaniem.',
        price: 99.00,
        stripe_price_id: 'price_test_webinar',
        type: 'video',
        content_url: 'https://vimeo.com/987654321',
        thumbnail_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        meta_title: 'Webinar Radzenie sobie ze stresem - Natalia Potocka',
        meta_desc: 'Zapis z webinaru na temat stresu.'
    },
    {
        id: uuidv4(),
        title: 'Konsultacja Indywidualna (1h)',
        slug: 'konsultacja-1h',
        description: 'Indywidualna usługa polegająca na spotkaniu online. Zamiast płacić od razu, napisz do mnie, aby ustalić dogodny termin.',
        price: 300.00,
        stripe_price_id: '',
        type: 'service',
        content_url: '',
        thumbnail_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        meta_title: 'Konsultacja Indywidualna - Natalia Potocka',
        meta_desc: 'Umów się na godzinną konsultację indywidualną.'
    }
];

try {
    const insert = db.prepare(`
        INSERT INTO products (id, title, slug, description, price, stripe_price_id, type, content_url, thumbnail_url, meta_title, meta_desc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Check if they already exist to prevent dupes
    for (const p of productsToSeed) {
        const exists = db.prepare('SELECT id FROM products WHERE slug = ?').get(p.slug);
        if (!exists) {
            insert.run(p.id, p.title, p.slug, p.description, p.price, p.stripe_price_id, p.type, p.content_url, p.thumbnail_url, p.meta_title, p.meta_desc);
            console.log(`Zasiano produkt: ${p.title}`);
        } else {
            console.log(`Produkt ${p.slug} już istnieje (Pomięcie).`);
        }
    }
    console.log('Seeding zakończony.');
} catch (error) {
    console.error('Błąd podczas seedowania:', error.message);
}
