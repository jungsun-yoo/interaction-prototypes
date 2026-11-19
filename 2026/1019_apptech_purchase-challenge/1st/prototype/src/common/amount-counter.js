/* Usage: const counter = new AmountCounter(element, { amount: 3000 });
   await counter.play(); counter.finish(); counter.destroy(); No dependencies. */
(function (global) {
    'use strict';
    class AmountCounter {
        constructor(element, options = {}) {
            if (!element) throw new TypeError('AmountCounter requires an element');
            this.element = element;
            this.options = { amount: 3000, delay: 0, duration: 1500, easing: 'ease', stagger: null, widthDelay: 1000, widthDuration: 1500, commaDelay: 1000, commaDuration: 200, fromZero: false, ...options };
            if (!Number.isSafeInteger(this.options.amount) || this.options.amount < 0) {
                throw new RangeError('amount must be a nonnegative safe integer');
            }
            this.formatted = this.options.amount.toLocaleString('en-US');
            this.original = element.textContent;
            this.originalLabel = element.getAttribute('aria-label');
            this.animations = [];
            this.run = 0;
            this.element.textContent = this.formatted;
        }
        finish() {
            this.run++;
            this.animations.forEach((animation) => animation.cancel());
            this.animations = [];
            const finalText = document.createElement('span');
            finalText.style.fontVariantNumeric = 'tabular-nums';
            finalText.textContent = this.formatted;
            this.element.replaceChildren(finalText);
            this.element.setAttribute('aria-label', this.formatted);
            if (this.resolve) { this.resolve(); this.resolve = null; }
        }
        destroy() {
            this.finish();
            this.element.textContent = this.original;
            if (this.originalLabel === null) this.element.removeAttribute('aria-label');
            else this.element.setAttribute('aria-label', this.originalLabel);
        }
        play({ delay = 0 } = {}) {
            this.finish();
            const token = this.run;
            const done = new Promise((resolve) => { this.resolve = resolve; });
            const computed = global.getComputedStyle(this.element);
            const lineHeight = parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.2;
            const viewport = document.createElement('span');
            viewport.setAttribute('aria-hidden', 'true');
            viewport.style.cssText = 'display:inline-block;position:relative;overflow:hidden;vertical-align:top;font-variant-numeric:tabular-nums;text-align:left;';
            viewport.style.height = `${lineHeight}px`;
            viewport.style.lineHeight = `${lineHeight}px`;
            const row = document.createElement('span');
            row.style.cssText = 'position:absolute;right:0;top:0;display:flex;white-space:nowrap;';
            viewport.append(row);
            this.element.replaceChildren(viewport);
            const digits = this.formatted.replace(/,/g, '').length;
            let seen = 0;
            const tracks = [], commas = [];
            for (const character of this.formatted) {
                const cell = document.createElement('span');
                cell.style.cssText = 'display:block;flex:none;position:relative;';
                cell.style.height = `${lineHeight}px`;
                row.append(cell);
                if (character === ',') {
                    cell.textContent = ',';
                    commas.push(cell);
                    continue;
                }
                const place = digits - ++seen;
                // fromZero: 일의 자리는 '0', 나머지는 빈칸에서 시작해 첫 프레임이 "0"으로 보이게 한다.
                const values = this.options.fromZero ? [place === 0 ? '0' : ''] : [place < 2 ? '?' : ''];
                const target = Number(character);
                const end = place < 2 ? (target === 0 ? 20 : 10 + target) : (target === 0 ? 10 : target);
                for (let index = 1; index <= end; index++) values.push(String(index % 10));
                const track = document.createElement('span');
                track.style.cssText = 'display:block;position:absolute;top:0;left:0;width:100%;';
                for (const value of values) {
                    const digit = document.createElement('span');
                    digit.style.cssText = 'display:block;text-align:center;';
                    digit.style.height = `${lineHeight}px`;
                    digit.style.lineHeight = `${lineHeight}px`;
                    digit.textContent = value || '\u00a0';
                    track.append(digit);
                }
                // Measure a numeral in the inherited font; reserve tabular-width reels.
                cell.textContent = '0';
                const width = cell.getBoundingClientRect().width;
                cell.style.width = `${width}px`;
                cell.replaceChildren(track);
                tracks.push({ track, end, place, width });
            }
            const fullWidth = row.getBoundingClientRect().width;
            const initialWidth = Math.min(fullWidth, tracks[0].width * (this.options.fromZero ? 1 : 2));
            viewport.style.width = `${fullWidth}px`;
            const animate = (element, frames, options) => {
                const animation = element.animate(frames, { fill: 'both', easing: this.options.easing, ...options });
                this.animations.push(animation);
            };
            const baseDelay = delay + this.options.delay;
            for (const { track, end, place } of tracks) {
                // Omit stagger to keep the original reference timing (0 / 150 / 750 / 900ms).
                const stagger = this.options.stagger == null
                    ? (place === 0 ? 0 : place === 1 ? 150 : 750 + (place - 2) * 150)
                    : place * this.options.stagger;
                animate(track, [{ transform: 'translateY(0)' }, { transform: `translateY(-${end * lineHeight}px)` }], {
                    delay: baseDelay + stagger, duration: this.options.duration,
                });
            }
            for (const comma of commas) animate(comma, [{ opacity: 0 }, { opacity: 1 }], {
                delay: baseDelay + this.options.commaDelay, duration: this.options.commaDuration,
            });
            // widthDuration accepts milliseconds or a function of the digit count (excluding commas).
            const widthDuration = typeof this.options.widthDuration === 'function'
                ? this.options.widthDuration(digits)
                : this.options.widthDuration;
            if (fullWidth > initialWidth) {
                animate(viewport, [{ width: `${initialWidth}px` }, { width: `${fullWidth}px` }], {
                    delay: baseDelay + this.options.widthDelay, duration: widthDuration,
                });
            }
            Promise.all(this.animations.map((animation) => animation.finished)).then(() => {
                if (this.run === token) this.finish();
            }).catch(() => {});
            return done;
        }
    }
    global.AmountCounter = AmountCounter;
})(window);
