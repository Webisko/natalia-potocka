import db from './db.js';

const reviews = [
    {
        author: 'Anna Kowalska',
        subtitle: 'Mama 2-miesięcznego Leona',
        content: '"Dzięki Natalii mój poród był najpiękniejszym doświadczeniem w życiu. Czułam się silna, sprawcza i zaopiekowana. To magia, której życzę każdej kobiecie."',
        order_index: 0
    },
    {
        author: 'Maria Nowak',
        subtitle: 'Mama Zuzi',
        content: '"Konsultacje z Natalią pozwoliły mi uporać się z traumą po pierwszej ciąży. W drugą ciążę weszłam z nowym, niesamowitym spokojem i stuprocentową otwartością na cud narodzin."',
        order_index: 1
    },
    {
        author: 'Ewa Wiśniewska',
        subtitle: 'Mama Filipka',
        content: '"Kurs \'Otulić Połóg\' podziałał na mnie wyciszająco i obniżył lęk. Przygotował mnie na trudy, których zupełnie się nie spodziewałam. Był moim kompasem i prawdziwym wybawieniem zaraz po powrocie ze szpitala."',
        order_index: 2
    }
];

const insert = db.prepare('INSERT INTO reviews (author, subtitle, content, order_index) VALUES (?, ?, ?, ?)');

for (const r of reviews) {
    insert.run(r.author, r.subtitle, r.content, r.order_index);
}

console.log('Seeded 3 reviews successfully.');
