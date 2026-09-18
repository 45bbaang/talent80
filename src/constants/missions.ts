export type Mission = {
  id: string;
  category: string;
  title: string;
  description: string;
  rewardPerCount: number;
};

export const MISSIONS: Mission[] = [
  { id: 'm01', category: '1달란트', title: '한 줄 말씀', description: '예배 후 은혜 받은 말씀 적기', rewardPerCount: 1 },
  { id: 'm02', category: '1달란트', title: '성경 읽기', description: '성경읽기 완료 올리기', rewardPerCount: 1 },
  { id: 'm03', category: '1달란트', title: '말씀 듣기', description: '말씀듣기 완료 + 한 줄 요약', rewardPerCount: 1 },
  { id: 'm04', category: '1달란트', title: '중보기도', description: '중보기도 완료 올리기', rewardPerCount: 1 },
  { id: 'm05', category: '1달란트', title: '예배', description: '찬양 전 도착 인증', rewardPerCount: 1 },
  { id: 'm06', category: '1달란트', title: '기관모임', description: '모임 참석 시 지급', rewardPerCount: 1 },
  { id: 'm07', category: '3달란트', title: '기도', description: '기도 인증 시 지급 (현장/가정 모두 OK)', rewardPerCount: 3 },
  { id: 'm08', category: '5달란트', title: '충성', description: '자모실 청소 등', rewardPerCount: 5 },
  { id: 'm09', category: '5달란트', title: '전도 모임', description: '전도 모임 참석 시 지급', rewardPerCount: 5 },
  { id: 'm10', category: '10달란트', title: '섬김', description: '기관모임 쓰레기 가져가기', rewardPerCount: 10 },
  { id: 'm11', category: '100달란트', title: '영혼', description: '전도 & 등록 시 지급', rewardPerCount: 100 },
];

export const CATEGORY_ORDER = ['1달란트', '3달란트', '5달란트', '10달란트', '100달란트'];
