var sumOddLengthSubarrays = function (arr) {
    let output = 0;
    for (let i = 1; i <= arr.length; i += 2) {
        for (let j = 0; j <= arr.length - i; j++) {
            for (let k = 0; k < i; k++) {
              output += arr[j + k];
            }
        }
    }
    return output
}
console.log(sumOddLengthSubarrays([1, 4, 2, 5, 3]
));
