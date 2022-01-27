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
