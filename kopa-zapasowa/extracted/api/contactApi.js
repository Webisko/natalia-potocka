import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const message = String(req.body?.message || '').trim();
    const website = String(req.body?.website || '').trim();

    if (website) {
        return res.status(400).json({ error: 'Nie udało się wysłać wiadomości.' });
    }

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Wypełnij wszystkie pola formularza.' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ error: 'Podaj poprawny adres e-mail.' });
    }

    if (message.length < 20) {
        return res.status(400).json({ error: 'Wiadomość jest zbyt krótka.' });
    }

    console.log('\n--- NOWA WIADOMOŚĆ KONTAKTOWA ---');
    console.log(`Od: ${name} <${email}>`);
    console.log(`IP: ${req.ip}`);
    console.log(message);
    console.log('--- KONIEC WIADOMOŚCI ---\n');

    res.json({ message: 'Wiadomość została wysłana.' });
});

export default router;