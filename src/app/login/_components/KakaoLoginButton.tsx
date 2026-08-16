import Image from "next/image";

interface KakaoLoginButtonProps {
  href: string;
}

// 카카오는 Google과 달리 HTML/CSS 스펙이 아니라 완성된 버튼 이미지를
// 공식 자산으로 제공한다(카카오 로그인 디자인 가이드 > 카카오 로그인
// 버튼 이미지). 임의로 늘리거나 배경/테두리를 다시 입히면 가이드 위반이라
// 원본 비율(183x45) 그대로 렌더링한다.
export function KakaoLoginButton({ href }: KakaoLoginButtonProps) {
  return (
    <a
      href={href}
      className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Image
        src="/kakao_login_medium_narrow.png"
        alt="카카오 로그인"
        width={183}
        height={45}
      />
    </a>
  );
}
