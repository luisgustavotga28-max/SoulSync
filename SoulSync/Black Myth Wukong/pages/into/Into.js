const heroBg = document.querySelector(".hero-bg");

document.querySelectorAll(".game").forEach(card => {

    const audio = new Audio(card.dataset.audio);
    audio.volume = 0.65;

    // PLAY ON HOVER
    card.addEventListener("mouseenter", () => {
        audio.currentTime = 0;
        audio.play().catch(()=>{});

        if (heroBg && card.dataset.bg) {
            heroBg.style.backgroundImage = `url(${card.dataset.bg})`;
            heroBg.classList.remove("is-exiting");
            heroBg.classList.remove("is-visible");
            void heroBg.offsetWidth;
            heroBg.classList.add("is-visible");
        }
    });

    // STOP ON LEAVE
    card.addEventListener("mouseleave", () => {
        audio.pause();
        audio.currentTime = 0;

        if (heroBg) {
            heroBg.classList.remove("is-visible");
            heroBg.classList.add("is-exiting");

            const handleTransition = () => {
                heroBg.classList.remove("is-exiting");
            };

            heroBg.addEventListener("transitionend", handleTransition, { once: true });
        }
    });

    // NAVIGATION
    card.addEventListener("click", () => {
        window.location.href = card.dataset.target;
    });
});
