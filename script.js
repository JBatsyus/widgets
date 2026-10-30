(function () {
    function bindTablist(options) {
        var root = options.root;
        if (!root) return null;

        var tabs = Array.prototype.slice.call(root.querySelectorAll(options.tabSelector));
        var panels = Array.prototype.slice.call(root.querySelectorAll(options.panelSelector));
        if (!tabs.length) return null;

        function activate(id, focusTab) {
            var activeTab = null;

            tabs.forEach(function (tab) {
                var isActive = tab.getAttribute(options.tabAttr) === id;
                tab.classList.toggle("is-active", isActive);
                tab.setAttribute("aria-selected", isActive ? "true" : "false");
                tab.tabIndex = isActive ? 0 : -1;
                if (isActive) activeTab = tab;
            });

            panels.forEach(function (panel) {
                var isActive = panel.getAttribute(options.panelAttr) === id;
                panel.classList.toggle("is-active", isActive);
                if (isActive) {
                    panel.removeAttribute("hidden");
                } else {
                    panel.setAttribute("hidden", "");
                }
            });

            if (typeof options.onActivate === "function") {
                options.onActivate(id, activeTab);
            }

            if (focusTab && activeTab) activeTab.focus();
            return activeTab;
        }

        tabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                activate(tab.getAttribute(options.tabAttr), false);
            });

            tab.addEventListener("keydown", function (event) {
                var index = tabs.indexOf(tab);
                var nextIndex = index;

                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    nextIndex = (index + 1) % tabs.length;
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    nextIndex = (index - 1 + tabs.length) % tabs.length;
                } else if (event.key === "Home") {
                    nextIndex = 0;
                } else if (event.key === "End") {
                    nextIndex = tabs.length - 1;
                } else {
                    return;
                }

                event.preventDefault();
                activate(tabs[nextIndex].getAttribute(options.tabAttr), true);
            });
        });

        return { activate: activate };
    }

    bindTablist({
        root: document.querySelector(".widgets-clinic-scale"),
        tabSelector: ".widgets-clinic-scale__tab",
        panelSelector: ".widgets-clinic-scale__panel",
        tabAttr: "data-tab",
        panelAttr: "data-panel"
    });

    var toolsRoot = document.querySelector(".widgets-tools");
    if (toolsRoot) {
        var isDesktop = window.matchMedia("(min-width: 993px)");
        var panelControllers = {};

        function initToolPanel(panel) {
            var items = Array.prototype.slice.call(panel.querySelectorAll(".widgets-tools__item"));
            var contents = Array.prototype.slice.call(panel.querySelectorAll(".widgets-tools__content-item"));
            if (!items.length) return null;

            var current = 0;

            function restartProgress(item) {
                var bar = item.querySelector(".widgets-tools__item-progress-bar");
                if (!bar) return;
                bar.style.animation = "none";
                void bar.offsetWidth;
                bar.style.animation = "";
            }

            function activateTool(index) {
                current = index;
                items.forEach(function (item, i) {
                    var isActive = i === index;
                    item.classList.toggle("widgets-tools__item--active", isActive);
                    if (isActive) {
                        item.setAttribute("aria-current", "true");
                    } else {
                        item.removeAttribute("aria-current");
                    }
                    if (isActive) restartProgress(item);
                });
                contents.forEach(function (content, i) {
                    var isActive = i === index;
                    content.classList.toggle("widgets-tools__content-item--active", isActive);
                    if (isActive) {
                        content.removeAttribute("aria-hidden");
                    } else {
                        content.setAttribute("aria-hidden", "true");
                    }
                });
            }

            function nextTool() {
                activateTool((current + 1) % items.length);
            }

            items.forEach(function (item, index) {
                item.addEventListener("click", function () {
                    activateTool(index);
                });

                item.addEventListener("mouseenter", function () {
                    if (!isDesktop.matches) return;
                    activateTool(index);
                });

                var bar = item.querySelector(".widgets-tools__item-progress-bar");
                if (!bar) return;
                bar.addEventListener("animationend", function () {
                    if (!isDesktop.matches) return;
                    if (!item.classList.contains("widgets-tools__item--active")) return;
                    nextTool();
                });
            });

            activateTool(0);

            return {
                reset: function () {
                    activateTool(0);
                }
            };
        }

        toolsRoot.querySelectorAll(".widgets-tools__main-panel").forEach(function (panel) {
            panelControllers[panel.getAttribute("data-main-panel")] = initToolPanel(panel);
        });

        bindTablist({
            root: toolsRoot,
            tabSelector: ".widgets-tools__tab",
            panelSelector: ".widgets-tools__main-panel",
            tabAttr: "data-main-tab",
            panelAttr: "data-main-panel",
            onActivate: function (id, activeTab) {
                if (panelControllers[id]) panelControllers[id].reset();
                if (activeTab && !isDesktop.matches) {
                    activeTab.scrollIntoView({
                        behavior: "smooth",
                        inline: "center",
                        block: "nearest"
                    });
                }
            }
        });
    }

    var examplesRoot = document.querySelector(".widgets-examples");
    if (examplesRoot && typeof Swiper !== "undefined") {
        var fractionCurrent = examplesRoot.querySelector(".widgets-examples__fraction-current");
        var fractionTotal = examplesRoot.querySelector(".widgets-examples__fraction-total");
        var prevEl = examplesRoot.querySelector(".widgets-examples__arrow--prev");
        var nextEl = examplesRoot.querySelector(".widgets-examples__arrow--next");

        function getRealSlidesCount(swiper) {
            return examplesRoot.querySelectorAll(
                ".widgets-examples__swiper > .swiper-wrapper > .swiper-slide:not(.swiper-slide-duplicate)"
            ).length || swiper.slides.length;
        }

        function updateFraction(swiper) {
            if (!fractionCurrent || !fractionTotal) return;
            fractionCurrent.textContent = String(swiper.realIndex + 1);
            fractionTotal.textContent = String(getRealSlidesCount(swiper));
        }

        examplesRoot.querySelectorAll(".widgets-examples__image").forEach(function (img) {
            function markEmpty() {
                var slide = img.closest(".widgets-examples__slide");
                if (slide) slide.classList.add("is-empty");
            }

            if (img.complete && img.naturalWidth === 0) {
                markEmpty();
            } else {
                img.addEventListener("error", markEmpty);
            }
        });

        var tabletMq = window.matchMedia("(max-width: 991px)");

        function isTabletOrMobile() {
            return tabletMq.matches;
        }

        function getSlideEasing() {
            return isTabletOrMobile() ? "linear" : "cubic-bezier(0.22, 1, 0.36, 1)";
        }

        function setSlideOpacities(swiper) {
            swiper.slides.forEach(function (slide) {
                var image = slide.querySelector(".widgets-examples__image");
                if (!image) return;

                var progress = Math.min(Math.abs(slide.progress), 1);
                image.style.opacity = String(1 - progress * 0.6);
            });
        }

        function setSlideTransitions(swiper, duration) {
            var easing = getSlideEasing();

            if (swiper.wrapperEl) {
                swiper.wrapperEl.style.transitionTimingFunction = easing;
            }

            // opacity идёт от progress в setTranslate — без CSS-задержки
            swiper.slides.forEach(function (slide) {
                var image = slide.querySelector(".widgets-examples__image");
                if (!image) return;
                image.style.transitionDuration = "0ms";
            });
        }

        function syncAutoplayMode(swiper) {
            if (isTabletOrMobile()) {
                swiper.params.speed = 8000;
                swiper.params.autoplay = {
                    delay: 0,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                    waitForTransition: true
                };
                if (swiper.autoplay) {
                    swiper.autoplay.start();
                }
            } else {
                if (swiper.autoplay) {
                    swiper.autoplay.stop();
                }
                swiper.params.speed = 850;
                swiper.params.autoplay = false;
            }
            setSlideTransitions(swiper, swiper.params.speed);
        }

        var examplesSwiper = new Swiper(examplesRoot.querySelector(".widgets-examples__swiper"), {
            slidesPerView: "auto",
            centeredSlides: true,
            spaceBetween: 10,
            loop: true,
            loopAdditionalSlides: 3,
            initialSlide: 0,
            speed: isTabletOrMobile() ? 8000 : 850,
            resistanceRatio: 0.7,
            longSwipesRatio: 0.25,
            threshold: 8,
            watchOverflow: true,
            watchSlidesProgress: true,
            allowTouchMove: true,
            autoplay: isTabletOrMobile()
                ? {
                    delay: 0,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                    waitForTransition: true
                }
                : false,
            navigation: {
                prevEl: prevEl,
                nextEl: nextEl
            },
            a11y: {
                prevSlideMessage: "Предыдущий пример",
                nextSlideMessage: "Следующий пример"
            },
            on: {
                init: function (swiper) {
                    setSlideTransitions(swiper, swiper.params.speed);
                    setSlideOpacities(swiper);
                    updateFraction(swiper);
                    syncAutoplayMode(swiper);
                },
                setTranslate: function (swiper) {
                    setSlideOpacities(swiper);
                },
                setTransition: function (swiper, duration) {
                    setSlideTransitions(swiper, duration);
                },
                slideChange: updateFraction,
                touchStart: function (swiper) {
                    if (isTabletOrMobile() && swiper.autoplay) {
                        swiper.autoplay.stop();
                    }
                },
                touchEnd: function (swiper) {
                    if (isTabletOrMobile() && swiper.autoplay) {
                        window.setTimeout(function () {
                            if (isTabletOrMobile() && swiper.autoplay) {
                                swiper.autoplay.start();
                            }
                        }, 1200);
                    }
                }
            }
        });

        if (typeof tabletMq.addEventListener === "function") {
            tabletMq.addEventListener("change", function () {
                syncAutoplayMode(examplesSwiper);
                examplesSwiper.update();
            });
        } else if (typeof tabletMq.addListener === "function") {
            tabletMq.addListener(function () {
                syncAutoplayMode(examplesSwiper);
                examplesSwiper.update();
            });
        }

        examplesRoot._examplesSwiper = examplesSwiper;
    }
})();
