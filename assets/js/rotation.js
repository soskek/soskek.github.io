// Interactive Title Rotation Effect
document.addEventListener("DOMContentLoaded", () => {
    // 1. Target the headings in the publications sections
    const targetSections = [
        document.getElementById("two"), // Refereed Publications
        document.getElementById("three") // Other Publications
    ];

    const rotatableChars = [];

    targetSections.forEach(section => {
        if (!section) return;
        const titles = section.querySelectorAll("h3");

        titles.forEach(title => {
            // Wrap characters in span for independent rotation
            // Collapse multiple whitespaces and newlines into single spaces to avoid huge gaps
            const text = title.textContent.replace(/\s+/g, ' ').trim();
            // Apply word-break styling to the parent h3 to prevent awkward wrapping of english words with span tags
            title.style.wordBreak = "keep-all";
            title.style.overflowWrap = "break-word";
            title.style.display = "flex";
            title.style.flexWrap = "wrap";
            title.style.rowGap = "0.2em";

            // Split into words first to preserve wrapping
            const words = text.split(' ');

            for (let w = 0; w < words.length; w++) {
                const wordStr = words[w];
                const wordSpan = document.createElement("span");
                wordSpan.style.whiteSpace = "nowrap"; // Keep word together
                wordSpan.style.display = "inline-flex";

                for (let i = 0; i < wordStr.length; i++) {
                    const charSpan = document.createElement("span");
                    charSpan.textContent = wordStr[i];

                    // Allow rotation without breaking flow
                    charSpan.style.display = "inline-block";
                    charSpan.style.transformOrigin = "center center";
                    charSpan.style.transition = "transform 0.1s linear";

                    rotatableChars.push(charSpan);
                    wordSpan.appendChild(charSpan);
                }

                title.appendChild(wordSpan);

                // Add space between words (except after the last word)
                if (w < words.length - 1) {
                    const spaceSpan = document.createElement("span");
                    spaceSpan.textContent = ' ';
                    spaceSpan.style.whiteSpace = "pre";
                    title.appendChild(spaceSpan);
                }
            }
        });
    });

    // 2. Mouse tracking with momentum
    let mouseX = window.innerWidth / 2;
    let mouseY = -1000; // start offscreen so they don't jump immediately
    let smoothX = mouseX;
    let smoothY = mouseY;
    let isMouseActive = false;

    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        isMouseActive = true;
    });

    // Stop tracking nicely on bounds exiting
    window.addEventListener("mouseleave", () => {
        isMouseActive = false;
    });

    // 3. Animation Loop
    function animate() {
        if (!isMouseActive) {
            // slowly drift back to default if mouse leaves
            smoothX += (window.innerWidth / 2 - smoothX) * 0.05;
            smoothY += (-1000 - smoothY) * 0.05;
        } else {
            // exponential moving average for momentum smooth effect (lower = more gentle)
            smoothX += (mouseX - smoothX) * 0.02;
            smoothY += (mouseY - smoothY) * 0.02;
        }

        rotatableChars.forEach(charSpan => {
            const rect = charSpan.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return; // skip if offscreen

            const charCenterX = rect.left + rect.width / 2;
            const charCenterY = rect.top + rect.height / 2;

            const dx = smoothX - charCenterX;
            const dy = smoothY - charCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Base angle to look at mouse
            let targetAngle = Math.atan2(dy, dx);

            // If mouse is to the left, flip the angle so the text's closest side points to the mouse
            // This prevents the "gimbal lock" feeling when moving mouse across the bottom/top
            if (dx < 0) {
                targetAngle += (targetAngle > 0 ? -Math.PI : Math.PI);
            }

            // Align horizontal direction with the mouse
            let rotateAngle = targetAngle;

            // Normalize angle to handle smooth snapping back to horizontal (0 rad)
            while (rotateAngle <= -Math.PI) rotateAngle += 2 * Math.PI;
            while (rotateAngle > Math.PI) rotateAngle -= 2 * Math.PI;

            // Attenuation logic:
            // If distance is very small (mouse over text), go back to horizontal (0 rotation)
            const minReadableDist = 60;
            const calmDownDist = 120;

            let intensity = 1.0;
            if (distance < minReadableDist) {
                intensity = 0.0;
            } else if (distance < calmDownDist) {
                intensity = (distance - minReadableDist) / (calmDownDist - minReadableDist);
            }

            // If mouse hasn't moved yet (mouseY is deeply negative), keep intensity 0
            if (smoothY < -500) intensity = 0;

            // Clamp angle to +/- 5 degrees (Math.PI / 36)
            const maxRotation = Math.PI / 36;
            let clampedAngle = Math.max(-maxRotation, Math.min(maxRotation, rotateAngle));

            // Apply rotation
            let finalAngle = clampedAngle * intensity;

            // Minor optimization: don't apply negligible rotations
            if (Math.abs(finalAngle) < 0.01) finalAngle = 0;

            charSpan.style.transform = `rotate(${finalAngle}rad)`;
        });

        requestAnimationFrame(animate);
    }

    // Keep it active and unconditionally run
    animate();
});
