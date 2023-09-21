
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

		lightBox(thumbsLight, heroLightbox, index);

		if (!lightbox) {
			thumbnails.forEach((e, i) => {
				if (i >= 4) {
					e.children[0].classList.remove("active");
					e.classList.remove("ring-active");
				}
			});

			thumbnailsArray = Array.from(thumbnails).slice(4);
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
			if (amountAdd <= 0) return;
			amountAdd -= 1;
		}

		amount.innerHTML = amountAdd;
	}


	// Next and Previous 2
	if (e.target.id == "previous-mobile" || e.target.id == "next-mobile") {
		let index = parseInt(
			hero.src.substring(hero.src.length - 5, hero.src.length - 4)
		);
		const firstIndex = index;

		if (e.target.id == "next-mobile") {
			index += 1;
		} else {
			index -= 1;
		}

		if (index > 4) {
			index = 1;
		} else if (index < 1) {
			index = 4;
		}

		hero.src = hero.src
			.slice(0, hero.src.length - 5)
			.concat(`${index}.jpg`);

		hero.classList.add("animate-change");
		setTimeout(() => {
			hero.classList.remove("animate-change");
		}, 400);
	}
});
