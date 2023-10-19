
// Amount items
const amount = document.querySelector("#amount");


// Thumbnails and Hero
const thumbnails = document.querySelectorAll(".thumbnails div");
const thumbsLight = document.querySelectorAll(".thumbnails-light div");
const hero = document.getElementById("hero");
const heroLightbox = document.getElementById("hero-lightbox");


let lightbox = false;

// Hamburger Menu
const sideNavbar = document.getElementById("side-nav");
const contentCover = document.getElementById("content-cover");


document.addEventListener("click", function (e) {

	function lightBox(thumbsLight, heroLight, index) {
		thumbsLight.forEach((e) => {
			e.children[0].classList.remove("active");
			e.classList.remove("ring-active");
		});
	
		let thumbnailsArray = Array.from(thumbsLight);
		let found = thumbnailsArray.find((e) => e.id == index);
	
		found.classList.add("ring-active");
		found.children[0].classList.add("active");
	
		heroLight.src = found.children[0].src;
	
		heroLight.classList.add("animate-change");
		setTimeout(() => {
			heroLight.classList.remove("animate-change");
		}, 400);
	}

	// Dynamic Hero
	if (e.target.id.includes("thumb")) {
		const index = e.target.id.substring(e.target.id.length - 1);
		const limit =e.target.dataset.total;

		lightBox(thumbsLight, heroLightbox, index);

		if (!lightbox) {
			thumbnails.forEach((e, i) => {
				if (i >= limit) {
					e.children[0].classList.remove("active");
					e.classList.remove("ring-active");
				}
			});

			 let thumbnailsArray = Array.from(thumbnails).slice(limit);
			found = thumbnailsArray.find((e) => e.id == index);

			found.classList.add("ring-active");
			found.children[0].classList.add("active");

			hero.src = found.children[0].src;

			hero.classList.add("animate-change");
			setTimeout(() => {
				hero.classList.remove("animate-change");
			}, 400);
		}

		return;
	}

	// Total increment/decrement
	if (e.target.id == "plus" || e.target.id == "minus") {
		let amountAdd = parseInt(amount.innerHTML);
		if (e.target.id == "plus") {
			amountAdd += 1;
		} else if (e.target.id == "minus") {
			if (amountAdd <= 1) return;
			amountAdd -= 1;
		}

		amount.innerHTML = amountAdd;
	}


});
