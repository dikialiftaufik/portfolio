        // --- DATA ---
        const translations = {
            en: {
                nav: ['Home', 'About', 'Portfolio', 'Contact'],
                hero: {
                    greeting: "Hello World,",
                    im: "I'm ", 
                    pitch: "Software Engineer", 
                    subPitch: "Building scalable solutions and leveraging AI to solve real-world problems.",
                    btnPrimary: "Explore Portfolio",
                    btnSecondary: "Let's Connect"
                },
                about: { title: "Get to Know Me Better", subtitle: "Ask me anything through this AI-powered chatbot" },
                portfolio: {
                    title: "Portfolio Showcase",
                    subtitle: "Explore my journey through complex projects, certifications, and my technical arsenal.",
                    tabs: ['Projects', 'Certificates', 'Tech Stack'],
                    more: "More to Come",
                    moreSub: "Continuously learning and upskilling."
                },
                contact: {
                    title: "Let's Build Something",
                    titleHigh: "Together.",
                    desc: "Open for collaborations, freelance projects and internships. I usually respond within 24 hours.",
                    name: "NAME",
                    email: "EMAIL",
                    loc: "LOCATION",
                    msg: "MESSAGE",
                    btn: "Send Message",
                    sending: "Sending…",
                    opening: "Opening your email app…",
                    sent: "Message sent. I usually respond within 24 hours.",
                    throttle: "Please wait a moment before sending again."
                },
                footer: {
                    quote: "Building the future, one line at a time.",
                    rights: "Built with React + Tailwind."
                }
            },
            id: {
                nav: ['Beranda', 'Tentang', 'Portofolio', 'Kontak'],
                hero: {
                    greeting: "Halo Dunia,",
                    im: "Saya ",
                    pitch: "Software Engineer",
                    subPitch: "Membangun solusi berskala besar dan memanfaatkan AI untuk masalah nyata.",
                    btnPrimary: "Lihat Portofolio",
                    btnSecondary: "Mari Terhubung"
                },
                about: { title: "Kenali Saya Lebih Dekat", subtitle: "Tanyakan apa saja melalui chatbot bertenaga AI ini" },
                portfolio: {
                    title: "Pameran Portofolio",
                    subtitle: "Jelajahi perjalanan saya melalui proyek kompleks, sertifikasi, dan kemampuan teknis.",
                    tabs: ['Proyek', 'Sertifikat', 'Teknologi'],
                    more: "Akan Datang",
                    moreSub: "Terus belajar dan meningkatkan keahlian."
                },
                contact: {
                    title: "Mari Membangun Sesuatu",
                    titleHigh: "Bersama.",
                    desc: "Terbuka untuk kolaborasi, proyek freelance, dan magang. Saya biasanya merespons dalam 24 jam.",
                    name: "NAMA",
                    email: "EMAIL",
                    loc: "LOKASI",
                    msg: "PESAN",
                    btn: "Kirim Pesan",
                    sending: "Mengirim…",
                    opening: "Membuka aplikasi email…",
                    sent: "Pesan terkirim. Saya biasanya merespons dalam 24 jam.",
                    throttle: "Tunggu sebentar sebelum mengirim lagi."
                },
                footer: {
                    quote: "Membangun masa depan, satu baris kode setiap waktu.",
                    rights: "Dibuat dengan React + Tailwind."
                }
            }
        };

// --- Locale Module ---
// Interface: get(path, lang) -> string. Falls back to English when a key
// is missing in the requested language (e.g. id.contact.name).
function get(path, lang) {
    const parts = String(path).split('.');
    const read = (obj) => parts.reduce(
        (acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj
    );
    const hit = read(translations[lang]);
    if (hit !== undefined) return hit;
    return read(translations.en);
}
