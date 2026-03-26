const OpenAI = require('openai');
const occupations = require('../data/occupations.json');
const deaths = require('../data/deaths.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const eras = [
  { name: "선사시대", minYear: -150000, maxYear: -10000 },
  { name: "신석기시대", minYear: -10000, maxYear: -3000 },
  { name: "고대 이집트", minYear: -3000, maxYear: -30 },
  { name: "고대 메소포타미아", minYear: -3500, maxYear: -539 },
  { name: "고대 그리스", minYear: -800, maxYear: -146 },
  { name: "로마 제국", minYear: -753, maxYear: 476 },
  { name: "고조선", minYear: -2333, maxYear: -108 },
  { name: "삼국시대 (한국)", minYear: -57, maxYear: 668 },
  { name: "통일신라", minYear: 668, maxYear: 935 },
  { name: "고려시대", minYear: 918, maxYear: 1392 },
  { name: "조선시대", minYear: 1392, maxYear: 1897 },
  { name: "중세 유럽", minYear: 476, maxYear: 1453 },
  { name: "바이킹 시대", minYear: 793, maxYear: 1066 },
  { name: "몽골 제국", minYear: 1206, maxYear: 1368 },
  { name: "르네상스", minYear: 1400, maxYear: 1600 },
  { name: "대항해시대", minYear: 1500, maxYear: 1700 },
  { name: "산업혁명", minYear: 1760, maxYear: 1840 },
  { name: "일제강점기", minYear: 1910, maxYear: 1945 },
  { name: "근현대", minYear: 1900, maxYear: 1980 },
  { name: "공룡시대", minYear: -150000, maxYear: -65000 },
  { name: "캄브리아기", minYear: -150000, maxYear: -100000 },
  { name: "빙하기", minYear: -110000, maxYear: -12000 },
  { name: "우주 (시간 무관)", minYear: -150000, maxYear: 1980 },
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePastLife() {
  const occupation = getRandomElement(occupations);

  let eligibleEras;
  switch (occupation.category) {
    case 'animal':
      if (['티라노사우루스', '프테라노돈', '암모나이트', '시조새', '삼엽충'].includes(occupation.name)) {
        eligibleEras = eras.filter(e => e.name.includes('공룡') || e.name.includes('캄브리아'));
      } else if (['매머드', '검치호랑이', '빙하기 거대 나무늘보', '스텔라바다소'].includes(occupation.name)) {
        eligibleEras = eras.filter(e => e.name.includes('빙하') || e.name.includes('선사'));
      } else {
        eligibleEras = eras.filter(e => !e.name.includes('우주'));
      }
      break;
    case 'alien':
      eligibleEras = eras.filter(e => e.name.includes('우주'));
      break;
    case 'microbe':
      eligibleEras = eras.filter(e => e.name.includes('캄브리아') || e.name.includes('선사') || e.name.includes('빙하') || e.name.includes('우주'));
      break;
    case 'object':
    case 'plant':
      eligibleEras = eras;
      break;
    case 'fantasy':
      eligibleEras = eras;
      break;
    default:
      eligibleEras = eras.filter(e => !e.name.includes('공룡') && !e.name.includes('캄브리아') && !e.name.includes('우주'));
  }

  if (!eligibleEras.length) eligibleEras = eras;

  const era = getRandomElement(eligibleEras);
  const year = Math.floor(Math.random() * (era.maxYear - era.minYear + 1)) + era.minYear;
  const death = getRandomElement(deaths);
  const yearStr = year < 0 ? `기원전 ${Math.abs(year)}년` : `${year}년`;

  return { name: occupation.name, category: occupation.category, era: era.name, year, yearStr, death };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName } = req.body;
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: '이름을 입력해주세요.' });
    }

    const pastLife = generatePastLife();

    const prompt = `당신은 전생을 읽어주는 신비로운 점술가입니다. 아래 정보를 바탕으로 재미있고 흥미진진한 전생 스토리를 만들어주세요.
한국어로 작성하며, 유머러스하면서도 극적인 이야기를 200자~350자 내외로 작성해주세요.

- 이름: ${userName}
- 전생 시대: ${pastLife.era} (${pastLife.yearStr})
- 전생의 존재/직업: ${pastLife.name} (카테고리: ${pastLife.category})
- 사망 원인: ${pastLife.death}

규칙:
1. 이름을 자연스럽게 전생 이름으로 변형해서 사용하세요 (예: "민수" → "미누스" 같은 그 시대/문화에 맞는 변형)
2. 카테고리가 animal/object/microbe/plant/alien인 경우, 해당 존재로서의 삶을 묘사하세요 (인간이 아닙니다!)
3. 시대 배경을 생생하게 묘사하세요
4. 사망 원인을 극적이고 웃기게 풀어내세요
5. 마지막에 현생에 대한 한 줄 조언을 해주세요
6. 반말(해체)을 사용하되 친근한 점술가 말투로 작성하세요`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 1.0,
    });

    const story = completion.choices[0].message.content;

    res.json({
      userName,
      era: pastLife.era,
      year: pastLife.yearStr,
      occupation: pastLife.name,
      category: pastLife.category,
      death: pastLife.death,
      story,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '전생을 읽는 중 오류가 발생했습니다. 다시 시도해주세요.' });
  }
};
