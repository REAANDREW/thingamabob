var digits = [];

var x = 894936;
var digit = 0;
do {
  digit = x % 128;
  x = parseInt(x / 128);
  if (x > 0) {
    digit = parseInt(digit) | 0x80;
  }

  digits.push(digit);

  if (digit < 128) {
    console.log((digit | 0x80).toString(2));
  } else {
    console.log(digit.toString(2));
  }
}
while (x > 0);

var multiplier = 1;
var value = 0;
do{
  digit = digits.shift();
  value += (digit & 127) * multiplier;
  multiplier *= 128;
}while((digit & 128) != 0);

console.log('finished');

console.log(value.toString());
