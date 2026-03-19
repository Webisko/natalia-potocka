import { Link } from 'react-router-dom';
import {
        BookOpen,
        Headphones,
        Heart,
        PlayCircle,
        Sparkles,
        Sprout,
        Users,
} from 'lucide-react';
import BlobArrowIcon from './BlobArrowIcon';

const offerCards = [
        {
                href: '/oferta/uzdrowienie-traumy-porodowej',
                badge: 'PRIORYTET',
                badgeIcon: Heart,
                title: 'Uzdrowienie Traumy Porodowej',
                highlight: 'Traumy Porodowej',
                description:
                        'Metoda Rewind to delikatna technika terapeutyczna, która pomaga przepracować trudne doświadczenie porodu bez konieczności bolesnego wracania do niego.',
        },
        {
                href: '/oferta/konsultacja-indywidualna',
                badge: 'MENTORING 1:1',
                badgeIcon: Users,
                title: 'Konsultacja Indywidualna',
                highlight: 'Indywidualna',
                description:
                        'Spotkanie jeden na jeden, podczas którego porządkujemy Twoje pytania, obawy i potrzeby. To bezpieczna przestrzeń na rozmowę o ciąży, porodzie i połogu.',
        },
];

const libraryCards = [
        {
                href: '/oferta/otulic-polog',
                title: 'Otulić Połóg',
                kind: 'Webinar',
                type: 'webinar',
                image: 'images/otulic_polog.png',
                description:
                        'Kompleksowy plan regeneracji na czwarty trymestr i spokojne wejście w pierwsze tygodnie z dzieckiem.',
                icon: PlayCircle,
        },
        {
                href: '/oferta/porod-domowy',
                title: 'Poród Domowy',
                kind: 'Webinar',
                type: 'webinar',
                image: 'images/porod_domowy.png',
                description:
                        'Fakty o bezpieczeństwie, kwalifikacji i warunkach, które pomagają ocenić, czy to rozwiązanie jest dla Ciebie.',
                icon: PlayCircle,
        },
        {
                href: '/oferta/glowa-w-porodzie',
                title: 'Głowa w Porodzie',
                kind: 'Webinar',
                type: 'webinar',
                image: 'images/glowa_w_porodzie.png',
                description:
                        'Zrozumienie mechanizmu lęku i konkretne narzędzia, które pomagają pracować z napięciem przed porodem.',
                icon: PlayCircle,
        },
        {
                href: '/oferta/hipnotyczny-obrot',
                title: 'Hipnotyczny Obrót',
                kind: 'Medytacja',
                type: 'meditation',
                image: 'images/hipnotyczny_obrot.png',
                description:
                        'Relaksacja wspierająca obrót dziecka z ułożenia miednicowego w końcówce ciąży.',
                icon: Headphones,
        },
];

const productTypeMeta = {
        webinar: {
                badgeClass: 'inline-flex rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-[clamp(0.68rem,0.66rem+0.07vw,0.76rem)] font-bold uppercase tracking-[0.16em] text-gold',
                blobClass: 'rounded-[42%_58%_65%_35%/38%_42%_58%_62%]',
        },
        meditation: {
                badgeClass: 'inline-flex rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-[clamp(0.68rem,0.66rem+0.07vw,0.76rem)] font-bold uppercase tracking-[0.16em] text-gold',
                blobClass: 'rounded-[58%_42%_36%_64%/44%_60%_40%_56%]',
        },
        course: {
                badgeClass: 'inline-flex rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-[clamp(0.68rem,0.66rem+0.07vw,0.76rem)] font-bold uppercase tracking-[0.16em] text-gold',
                blobClass: 'rounded-[34%_66%_58%_42%/53%_37%_63%_47%]',
                icon: BookOpen,
        },
};

const valueCards = [
        {
                icon: Sprout,
                title: 'Czujesz luz i spokój',
                description:
                        'Zamiast lęku przed porodem pojawia się gotowość, ciekawość i większe zaufanie do siebie.',
        },
        {
                icon: Heart,
                title: 'Masz pewność siebie',
                description:
                        'Budujesz kontakt z intuicją i wzmacniasz poczucie, że możesz przejść przez ten etap po swojemu.',
                featured: true,
        },
        {
                icon: BookOpen,
                title: 'Masz rzetelną wiedzę',
                description:
                        'Dostajesz sprawdzone informacje o porodzie, połogu i laktacji bez chaosu i bez straszenia.',
        },
];

function imageSrc(path) {
        return `${import.meta.env.BASE_URL}${path}`;
}

function VeinDecoration({ className = '', viewBox = '0 0 1440 600' }) {
        return (
                <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`.trim()} viewBox={viewBox} preserveAspectRatio="none">
                        <path d="M-100,300 C300,100 700,500 1100,250 C1350,100 1500,300 1700,200" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="8 18" className="animate-flow-vein-gold" />
                        <path d="M-100,360 C300,160 700,560 1100,310 C1350,160 1500,360 1700,260" fill="none" stroke="#E6B8B8" strokeWidth="2.5" strokeDasharray="14 28" className="animate-flow-vein-rose" />
                </svg>
        );
}

function BlobLink({ href, label, tone = 'gold' }) {
        const circleTone = tone === 'mauve' ? 'bg-mauve' : 'bg-gold';

        return (
                <Link to={href} className="group relative inline-flex h-12 min-w-[12rem] w-auto items-center justify-start border-0 outline-none">
                        <span className={`circle absolute left-0 top-0 z-0 block h-12 w-12 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] ${circleTone} transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:w-full group-hover:rounded-[1.625rem]`} aria-hidden="true">
                                <BlobArrowIcon wrapperClassName="left-[0.72rem] h-7 w-7" />
                        </span>
                        <span className="relative z-10 w-full whitespace-nowrap pl-14 pr-6 text-center text-fs-label font-bold uppercase tracking-wider text-mauve transition-all duration-500 ease-[cubic-bezier(0.65,0,0.076,1)] group-hover:text-white">
                                {label}
                        </span>
                </Link>
        );
}

function OfferCard({ card, tone = 'gold' }) {
        const BadgeIcon = card.badgeIcon;
        const [lead, tail] = card.title.split(` ${card.highlight}`);

        return (
                <article className="group relative isolate rounded-[30px] border border-white/70 bg-white/85 p-8 shadow-xl shadow-rose/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:p-10">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mauve/10 bg-mauve/5 px-4 py-1.5 text-fs-label font-bold uppercase tracking-[0.18em] text-mauve">
                                <BadgeIcon size={15} className="text-gold" />
                                {card.badge}
                        </div>
                        <h3 className="font-serif text-fs-title-md leading-tight text-mauve">
                                <Link to={card.href} className="transition-colors group-hover:text-terracotta">
                                        {lead} <span className="text-gold italic">{card.highlight}</span>
                                </Link>
                        </h3>
                        <p className="mt-5 max-w-xl text-fs-body-lg font-light leading-relaxed text-mauve/70">{card.description}</p>
                        <div className="mt-8">
                                <BlobLink href={card.href} label="Dowiedz się więcej" tone={tone} />
                        </div>
                </article>
        );
}

function LibraryCard({ card }) {
        const meta = productTypeMeta[card.type] || productTypeMeta.webinar;
        const CardIcon = card.icon || meta.icon;

        return (
                <article className="group relative overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-xl shadow-rose/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                        <Link to={card.href} className="block aspect-[4/3] overflow-hidden bg-blush/20">
                                <img src={imageSrc(card.image)} alt={card.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        </Link>
                        <div className="p-6">
                                <div className="mb-3 flex items-start justify-between gap-4">
                                        <div>
                                                <span className={meta.badgeClass}>{card.kind}</span>
                                                <h4 className="font-serif text-fs-title-sm text-mauve">
                                                        <Link to={card.href} className="transition-colors group-hover:text-terracotta">
                                                                {card.title}
                                                        </Link>
                                                </h4>
                                        </div>
                                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center bg-mauve/5 text-mauve transition-all duration-300 group-hover:scale-105 group-hover:bg-terracotta group-hover:text-white ${meta.blobClass}`.trim()}>
                                                <CardIcon size={18} />
                                        </div>
                                </div>
                                <p className="text-fs-ui font-light leading-relaxed text-mauve/70">{card.description}</p>
                        </div>
                </article>
        );
}

export default function AstroHomeSections() {
        return (
                <div className="w-full bg-nude">
                        <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-blush/30 via-nude to-white">
                                <VeinDecoration className="opacity-40" viewBox="0 0 1440 900" />
                                <div className="absolute right-20 top-20 h-64 w-64 rounded-full bg-rose/20 blur-[80px] animate-float" />
                                <div className="absolute bottom-20 left-20 h-80 w-80 rounded-full bg-goldLight/30 blur-[100px] animate-pulse-slow" />

                                <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col-reverse items-center gap-12 px-8 pb-12 pt-20 md:flex-row md:px-16">
                                        <div className="flex-1 space-y-8 text-center md:text-left">
                                                <h1 className="font-serif text-4xl leading-[1.1] text-mauve drop-shadow-sm md:text-6xl lg:text-7xl">
                                                        Wesprę Cię w drodze do <span className="bg-gradient-to-r from-gold to-[#B88A44] bg-clip-text pr-2 italic text-transparent">świadomego porodu</span>
                                                </h1>
                                                <p className="max-w-xl text-lg font-light leading-relaxed text-mauve/80 md:text-xl">Mam na imię <strong>Natalia</strong>, jestem terapeutką traumy i wsparciem na Twojej drodze przez macierzyństwo.</p>
                                                <div className="flex flex-col gap-4 pt-6 md:flex-row md:justify-start">
                                                        <BlobLink href="/#oferta" label="Zobacz, jak mogę Ci pomóc" tone="gold" />
                                                        <BlobLink href="/o-mnie" label="Poznaj mnie" tone="mauve" />
                                                </div>
                                        </div>

                                        <div className="relative flex flex-1 items-center justify-center">
                                                <div className="relative h-[400px] w-[300px] md:h-[500px] md:w-[400px]">
                                                        <div className="absolute inset-0 scale-110 animate-morph bg-gold/10 mix-blend-multiply" />
                                                        <img src={imageSrc('images/hero_doula.png')} alt="Natalia Potocka - terapeutka" className="relative h-full w-full animate-float object-cover shadow-2xl" style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }} loading="eager" />
                                                </div>
                                        </div>
                                </div>

                                <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-nude via-nude/80 to-transparent" />
                        </section>

                        <section className="relative flex min-h-[500px] items-center justify-center overflow-hidden bg-nude py-32">
                                <VeinDecoration className="opacity-30" />
                                <div className="absolute left-[5%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-rose/10 blur-[60px] animate-breathe mix-blend-multiply" />
                                <div className="absolute right-[5%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gold/5 blur-[80px] animate-pulse-slow mix-blend-multiply" />

                                <div className="relative z-10 mx-auto max-w-4xl px-8 text-center md:px-12">
                                        <div className="relative mb-10 inline-block">
                                                <div className="absolute inset-0 h-16 w-16 rounded-full bg-gold/20 blur-xl" />
                                                <Sparkles size={32} className="relative z-10 text-gold animate-heartbeat" />
                                        </div>
                                        <blockquote className="font-serif text-2xl italic leading-relaxed text-mauve drop-shadow-sm md:text-4xl lg:text-[2.75rem]">
                                                "Macierzyństwo to nie tylko rola, którą przyjmujesz, ale głęboka podróż do wnętrza siebie. Jestem tu, by towarzyszyć Ci w każdym kroku tej drogi."
                                        </blockquote>
                                        <div className="mt-14 flex flex-col items-center gap-3">
                                                <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-gold/20">
                                                        <div className="absolute inset-0 animate-flow-slower rounded-full bg-gradient-to-r from-transparent via-gold to-transparent" />
                                                </div>
                                                <span className="mt-2 text-sm font-bold uppercase tracking-[0.25em] text-mauve/80">Natalia Potocka</span>
                                        </div>
                                </div>
                        </section>

                        <section className="relative overflow-hidden bg-nude py-24">
                                <div className="absolute left-[-5%] top-[10%] h-[400px] w-[400px] rounded-full bg-blush/40 blur-[80px] animate-breathe" />
                                <div className="absolute bottom-[10%] right-[-5%] h-[300px] w-[300px] rounded-full bg-gold/5 blur-[60px] animate-pulse-slow" />

                                <div className="relative z-10 mx-auto max-w-[1440px] px-8 md:px-16">
                                        <div className="mx-auto mb-20 max-w-3xl text-center">
                                                <h2 className="font-serif text-3xl text-mauve md:text-5xl">Odkryj swoją naturę</h2>
                                                <p className="mt-6 text-lg font-light leading-relaxed text-mauve/60">
                                                        Moje podejście opiera się na przekonaniu, że poród to instynktowne wydarzenie. Wspólnie budujemy trzy kluczowe filary.
                                                </p>
                                        </div>

                                        <div className="grid items-stretch gap-8 md:grid-cols-3">
                                                {valueCards.map((card) => {
                                                        const CardIcon = card.icon;

                                                        return (
                                                                <div key={card.title} className={`blob-card group relative isolate flex flex-col items-center rounded-[30px] p-8 text-center transition-all duration-300 ${card.featured ? 'md:-mt-8' : ''}`.trim()}>
                                                                        <div className={`blob-bg absolute left-1/2 top-8 -z-10 -ml-20 h-40 w-40 origin-center transition-all duration-500 ease-out group-hover:!inset-0 group-hover:!ml-0 group-hover:!h-full group-hover:!w-full group-hover:!rounded-[30px] ${card.featured ? 'animate-heartbeat bg-terracotta shadow-xl shadow-terracotta/20 group-hover:!shadow-2xl group-hover:!animate-none' : 'bg-white shadow-sm group-hover:!bg-white/95 group-hover:!shadow-2xl group-hover:!shadow-mauve/10'}`.trim()} style={{ borderRadius: card.featured ? '35% 65% 63% 37% / 42% 43% 57% 58%' : '54% 46% 42% 58% / 44% 48% 52% 56%' }} />
                                                                        <div className="relative z-10 mb-6 flex h-40 w-40 items-center justify-center">
                                                                                <CardIcon size={card.featured ? 56 : 48} className={`${card.featured ? 'animate-heartbeat text-white group-hover:animate-none' : 'text-terracotta'} transition-transform duration-500 group-hover:scale-110`.trim()} />
                                                                        </div>
                                                                        <div className="relative z-10">
                                                                                <h3 className={`mb-4 font-serif text-2xl ${card.featured ? 'text-mauve transition-colors duration-300 group-hover:text-white' : 'text-mauve'}`.trim()}>{card.title}</h3>
                                                                                <p className={`mx-auto max-w-xs font-light leading-relaxed ${card.featured ? 'text-mauve/70 transition-colors duration-300 group-hover:text-white/90' : 'text-mauve/70'}`.trim()}>{card.description}</p>
                                                                        </div>
                                                                </div>
                                                        );
                                                })}
                                        </div>
                                </div>
                        </section>

                        <section id="oferta" className="relative overflow-visible bg-nude py-24">
                                <div className="relative z-10 mx-auto max-w-[1440px] px-8 md:px-16">
                                        <div className="mx-auto mb-16 max-w-3xl text-center">
                                                <h2 className="font-serif text-4xl text-mauve md:text-5xl">
                                                        Wsparcie skrojone <span className="relative inline-block">na miarę<span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-gold opacity-60" /></span>
                                                </h2>
                                                <p className="mt-6 text-lg font-light text-mauve/70">Niezależnie od tego, na jakim etapie jesteś, znajdziesz tu bezpieczną przystań.</p>
                                        </div>

                                        <div className="mb-24 grid gap-8 lg:grid-cols-2">
                                                <OfferCard card={offerCards[0]} tone="gold" />
                                                <OfferCard card={offerCards[1]} tone="mauve" />
                                        </div>

                                        <div id="webinary" className="scroll-mt-32">
                                                <div className="mb-16 text-center">
                                                        <h3 className="font-serif text-4xl text-mauve md:text-5xl">Webinary i Medytacje</h3>
                                                        <p className="mt-4 text-lg font-light text-mauve/60">Wiedza i ukojenie dostępne na wyciągnięcie ręki.</p>
                                                </div>

                                                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                                                        {libraryCards.map((card) => (
                                                                <LibraryCard key={card.href} card={card} />
                                                        ))}
                                                </div>
                                        </div>
                                </div>
                        </section>

                        <section id="about" className="relative overflow-hidden bg-nude py-32">
                                <div className="absolute left-10 top-1/3 h-96 w-96 rounded-full bg-rose/10 blur-[120px] animate-breathe" />

                                <div className="relative z-10 mx-auto max-w-[1440px] px-8 md:px-16">
                                        <div className="flex flex-col items-center gap-16 md:flex-row">
                                                <div className="order-2 w-full md:order-1 md:w-1/2">
                                                        <h2 className="font-serif text-4xl text-mauve md:text-5xl">
                                                                Matematyczka,
                                                                <br />
                                                                która zaufała <span className="text-gold italic">intuicji</span>.
                                                        </h2>
                                                        <div className="mt-8 space-y-6 text-lg font-light leading-relaxed text-mauve/80">
                                                                <p>Brzmi jak sprzeczność? Dla mnie to pełnia. Z wykształcenia jestem umysłem ścisłym i wiem, jak ważne są fakty oraz rzetelna wiedza.</p>
                                                                <p>Ale macierzyństwo nauczyło mnie, że <span className="font-medium text-mauve">najważniejsze dzieje się między słowami</span>, w emocjach i w ciele.</p>
                                                                <p>Łączę oba światy. Daję Ci konkret, żebyś czuła się bezpiecznie, i obecność, dzięki której możesz poczuć się naprawdę zaopiekowana.</p>
                                                        </div>
                                                        <div className="mt-10">
                                                                <BlobLink href="/o-mnie" label="Poznaj mnie lepiej" tone="gold" />
                                                        </div>
                                                </div>

                                                <div className="order-1 flex w-full justify-center md:order-2 md:w-1/2">
                                                        <div className="relative h-[350px] w-[350px] md:h-[450px] md:w-[450px]">
                                                                <div className="absolute inset-0 scale-105 animate-morph bg-rose/20 blur-md" />
                                                                <div className="absolute inset-0 scale-105 rotate-12 animate-morph border border-gold/40" />
                                                                <div className="relative h-full w-full overflow-hidden shadow-2xl transition-all duration-700 hover:scale-[1.02]" style={{ borderRadius: '56% 44% 30% 70% / 60% 30% 70% 40%' }}>
                                                                        <div className="pointer-events-none absolute inset-0 z-10 bg-gold/5 mix-blend-overlay" />
                                                                        <img src={imageSrc('images/about_doula.png')} alt="Natalia Potocka" className="h-full w-full object-cover" loading="lazy" />
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </section>
                </div>
        );
}