

const fileInput = document.getElementById('file_input');
const croppedImageContainer = document.getElementById('croppedImageContainer');


let cropper;

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  // Ensure the file is an image
  if (file && file.type.startsWith('image/')) {
    // Create a new FileReader to read the selected image
    const reader = new FileReader();

    reader.onload = (e) => {
      // Destroy any previous instances of Cropper.js
      if (cropper) {
        cropper.destroy();
      }

      // Create an image element and set its source to the selected file
      const img = new Image();
      img.src = e.target.result;

      // Append the image to the container
    //   croppedImageContainer.innerHTML = '';
      croppedImageContainer.appendChild(img);

      // Initialize Cropper.js on the image
      cropper = new Cropper(img, {
        aspectRatio: 1, // Set the aspect ratio as needed
        viewMode: 1,    // Set the view mode as needed
      });
    };
    reader.readAsDataURL(file);
   
    // Read the selected file as a data URL
  }
});
 // Add a save button for the image
 let saveButton=document.getElementById('save')
    saveButton.textContent = 'Save';
    saveButton.onclick = function() {
        let canvas = cropper.getCroppedCanvas();
        canvas.toBlob(function(blob) {
            // Create a new blob URL for the cropped image
            let croppedImageUrl = URL.createObjectURL(blob);
            let fileName="cropped.jpeg"
       
            const file = new File([blob], fileName, { type: 'image/jpeg' })
            
            const dataTransfer = new DataTransfer();
                 
                        dataTransfer.items.add(file);

                    
                    fileInput.files = dataTransfer.files;

            // Create a new FormData object and append the Blob
            let formData = new FormData();
            formData.append('croppedImage', blob, 'croppedImage.png');
        }, 'image/png');
    };
