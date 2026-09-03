import { vi } from "vitest";

// jsdom 에는 Kakao Maps SDK 가 없다. window.kakao 를 최소 구현으로 채우고,
// 생성된 인스턴스를 배열로 노출해 테스트가 마커·폴리라인 수를 검증하게 한다.
// 테스트 파일에서 필요할 때만 installKakaoMock() 을 부른다(자동 로드 아님).

export interface KakaoMockInstances {
  maps: MockMap[];
  polylines: MockPolyline[];
  overlays: MockCustomOverlay[];
  markers: MockMarker[];
}

class MockLatLng {
  constructor(
    public lat: number,
    public lng: number,
  ) {}
  getLat() {
    return this.lat;
  }
  getLng() {
    return this.lng;
  }
}

class MockLatLngBounds {
  points: MockLatLng[] = [];
  extend(p: MockLatLng) {
    this.points.push(p);
  }
  isEmpty() {
    return this.points.length === 0;
  }
}

class MockMap {
  setBounds = vi.fn();
  setCenter = vi.fn();
  // 실제 SDK처럼 레벨을 보관해 setLevel/getLevel 이 짝을 이루게 한다.
  level: number;
  setLevel = vi.fn((level: number) => {
    this.level = level;
  });
  getLevel = vi.fn(() => this.level);
  relayout = vi.fn();
  // 좌표 → 컨테이너 픽셀 근사(위경도에 큰 스케일). 라벨 겹침/뒤집기 계산 검증용.
  getProjection = vi.fn(() => ({
    containerPointFromCoords: (ll: MockLatLng) =>
      new MockPoint((ll.lng - 127) * 5000, (36 - ll.lat) * 5000),
  }));
  constructor(
    public container: HTMLElement,
    public options: unknown,
  ) {
    const opts = options as { level?: number } | null;
    this.level = opts?.level ?? 3;
  }
}

class MockPolyline {
  setMap = vi.fn();
  constructor(public options: { strokeStyle?: string }) {}
}

class MockCustomOverlay {
  setMap = vi.fn();
  constructor(public options: { content: string | HTMLElement }) {}
}

class MockMarker {
  setMap = vi.fn();
  constructor(public options: unknown) {}
}

class MockSize {
  constructor(
    public width: number,
    public height: number,
  ) {}
}

class MockPoint {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

export function installKakaoMock(): KakaoMockInstances {
  const instances: KakaoMockInstances = {
    maps: [],
    polylines: [],
    overlays: [],
    markers: [],
  };

  const maps = {
    LatLng: MockLatLng,
    LatLngBounds: MockLatLngBounds,
    Size: MockSize,
    Point: MockPoint,
    Map: class extends MockMap {
      constructor(container: HTMLElement, options: unknown) {
        super(container, options);
        instances.maps.push(this);
      }
    },
    Polyline: class extends MockPolyline {
      constructor(options: { strokeStyle?: string }) {
        super(options);
        instances.polylines.push(this);
      }
    },
    CustomOverlay: class extends MockCustomOverlay {
      constructor(options: { content: string | HTMLElement }) {
        super(options);
        instances.overlays.push(this);
      }
    },
    Marker: class extends MockMarker {
      constructor(options: unknown) {
        super(options);
        instances.markers.push(this);
      }
    },
    load: (cb: () => void) => cb(),
  };

  // biome-ignore lint/suspicious/noExplicitAny: 테스트 전역에 SDK 표면을 최소 주입
  (window as any).kakao = { maps };

  return instances;
}

export function uninstallKakaoMock() {
  // biome-ignore lint/suspicious/noExplicitAny: 위 주입 해제
  (window as any).kakao = undefined;
}
