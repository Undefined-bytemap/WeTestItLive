(function () {
    const ua = navigator.userAgent;
    const ref = document.referrer;
    const lang = navigator.language || navigator.userLanguage;
    const page = location.pathname;    fetch(`https://script.google.com/macros/s/AKfycbyknfx4sbvZJNHSzQlvv42FloVnkpbf99Qu3WBe2ErfxlUpGieDBI7djJGL3Te8Px-qvA/exec?ua=${encodeURIComponent(ua)}&ref=${encodeURIComponent(ref)}&lang=${encodeURIComponent(lang)}&page=${encodeURIComponent(page)}`)
        .catch(() => {
            // Expected due to CORS; data still sent
        });
})();
