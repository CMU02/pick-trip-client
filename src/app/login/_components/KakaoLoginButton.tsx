interface KakaoLoginButtonProps {
  href: string;
}

// 카카오는 공식 이미지 자산(PNG)만 제공하고 크기가 183x45로 고정돼 있어,
// 옆의 구글 버튼(공식 스펙상 높이 40px)과 나란히 두면 높이도 너비도
// 어긋났다. 카카오 로그인 디자인 가이드가 규정하는 배경색(#FEE500)·
// 아이콘(말풍선)·문구·패딩(구글과 동일한 0 12px)·글자 크기는 그대로
// 지키되, 구글 버튼과 같은 40px 높이 · 200px 너비 박스에 맞춰 직접
// SVG로 그렸다. 아이콘은 왼쪽에 고정하고 문구는 남는 공간에서 가운데
// 정렬해, 너비를 넓혀도 구글 버튼(아이콘 고정 + 텍스트 flex-grow)과
// 같은 방식으로 균형 있게 보이게 했다. 아이콘 색(#000000)·radius(12px)는
// 요청에 따라 공식 PNG 자산과 다르게 조정했다. 폰트는 시스템 기본 서체로
// 바꿔봤다가 예전(사이트 기본 Paperlogy 상속) 쪽을 쓰기로 해 되돌렸다.
export function KakaoLoginButton({ href }: KakaoLoginButtonProps) {
  return (
    <a
      href={href}
      className="inline-flex h-10 w-[200px] items-center rounded-[12px] bg-[#FEE500] px-3 text-sm font-medium text-[#191919] transition-shadow select-none hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <title>Kakao</title>
        <path
          fill="#000000"
          d="M10 2C5.03 2 1 5.13 1 9c0 2.42 1.61 4.56 4.04 5.79-.18.65-.64 2.36-.73 2.73-.12.46.17.45.35.33.15-.1 2.3-1.56 3.23-2.19.36.05.72.08 1.11.08 4.97 0 9-3.13 9-7S14.97 2 10 2Z"
        />
      </svg>
      <span className="flex-1 text-center">카카오 로그인</span>
    </a>
  );
}
