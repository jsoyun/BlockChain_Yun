//map 함수 배열에서 사용가능
const arr = [1, 2, 3];
console.log(arr);
//배열안에 있는 값을 2씩 더해보려고 함
//for문쓰는 법
// const res = [];
// for (let i = 0; i < arr.length; i++) {
//   res.push(arr[i] * 2);
// }

// console.log(res);
//map함수 쓰기
//map함수 안에 callback함수 들어감
const res1 = arr.map((값) => {
  return 값 * 2;
});
console.log(res1);
//화살표 간단하게 짧게 줄여서 쓸 수 도 있음
const res2 = arr.map((값) => 값 * 3);
console.log(res2);
//만약에 인덱스에도 접근하고 싶으면
const res3 = arr.map((값, 인덱스) => 인덱스);
console.log(res3);
//지금은 배열안에 있는게 숫자인데 객체여도 가능하다!
const items = [
  { id: 1, name: "kaka" },
  { id: 2, name: "coco" },
];
const result = items.map((아이템) => {
  id: 아이템.id;
});

console.log(result);

//객체를 return할때는 중괄호를 해주고 리턴해야되지요
const result1 = items.map((아이템) => {
  return { id: 아이템.id };
});

console.log(result1);

//reduce 함수/////////////////////////////////////////////////
//배열.reduce((누적값, 현잿값, 인덱스, 요소)
//=> { return 결과 }, 초깃값);
const abc = [1, 2, 3];
const result2 = abc.reduce((누적값, 현재값, 인덱스) => {
  console.log(누적값, 현재값, 인덱스);
  return 누적값 + 현재값;
}, 0);

console.log(result2);

//a가 초기값인 0부터시작해서 return하는 대로 누적되는거임
//0,1,0
//1,2,1
//3,3,2

//초기값이 없을경우!
//abc=1,2,3
const resultNoInit = abc.reduce((누적값, 현재값, 인덱스) => {
  console.log(누적값, 현재값, 인덱스);
  return 누적값 + 현재값;
});

console.log("초기값없는경우", resultNoInit);
//0,1,0
//1,2,1
//3,3,2
//6

const abc2 = [0, 2, 4];
const result3 = abc2.reduce((누적값, 현재값, 인덱스) => {
  console.log(누적값, 현재값, 인덱스);
  return 누적값 + 현재값;
}, 0);

console.log(result3);
//0,0,0
//0,2,1
//2,4,2
//6

const result4 = abc2.reduce((누적값, 현재값, 인덱스) => {
  console.log(누적값, 현재값, 인덱스);
  return 누적값 + 현재값;
}, 5);

console.log(result4);
//5,0,0
//5,2,1
//7,4,2
//11
////////////////////////////////////////////////////////

//map함수 예제를 reduce로 만들어보겠다
const 원투쓰 = [1, 2, 3];
결과 = 원투쓰.reduce((누적값, 현재값) => {
  누적값.push(현재값 % 2 ? "홀수" : "짝수");
  return 누적값;
}, []);

//초기값 빈배열......
//홀수, 짝수,홀수
console.log(결과);
