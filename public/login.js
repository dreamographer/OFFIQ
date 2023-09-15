const signUpButton = document.querySelectorAll('.signUp');
const signInButton = document.querySelectorAll('.signIn');
const container = document.getElementById('container');
console.log(signUpButton.length);
signUpButton.forEach(element => {
	element.addEventListener('click', () => {
		
		container.classList.add("right-panel-active");
	});
});
signInButton.forEach(element => {
	element.addEventListener('click', () => {
		container.classList.remove("right-panel-active");
	});
});
