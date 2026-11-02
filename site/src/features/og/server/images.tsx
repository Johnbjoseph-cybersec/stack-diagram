import { type FontWeight, GoogleFont } from "@cf-wasm/og/workerd";
import { jaModel, Parser } from "budoux";
import type { CSSProperties, ReactNode } from "react";

export const OG_SIZE = { width: 1200, height: 630 };

// satori cannot read CSS variables, so these copy the Figma tokens.
const PAPER = "#edf8fe";
const IRIS_TINT = "#daecfd";
const SURFACE = "#fbfcff";
const IRIS = "#176297";
const INK = "#0e2336";

const LATIN_FIRST = "Figtree, M PLUS 2";
const CJK_FIRST = "M PLUS 2, Figtree";
const WORDMARK = "stack-diagram";
const LEAD = "An agent skill that draws architecture diagrams with official logos.";

const NBSP = "\u00a0";
const CJK = /[\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/;
const parser = new Parser(jaModel);

// Google Fonts answers 400 when a family has none of the text, so both families get a space and an NBSP.
const loadFonts = (texts: [FontWeight, string][]) =>
  texts.flatMap(([weight, text]) =>
    ["Figtree", "M PLUS 2"].map(
      (family) => new GoogleFont(family, { weight, text: `${text} ${NBSP}` }),
    ),
  );

// satori breaks CJK anywhere and trims spaces at the edges of flex items, so titles wrap as
// budoux phrases and words, each keeping a following space as an NBSP.
function splitPhrases(text: string) {
  const chunks: string[] = [];
  for (const phrase of parser.parse(text)) {
    for (const piece of phrase.split(/(\s+)/)) {
      const last = chunks.at(-1);
      if (piece.trim()) {
        chunks.push(piece);
      } else if (piece && last !== undefined) {
        chunks[chunks.length - 1] = last + NBSP;
      }
    }
  }
  return chunks;
}

const TITLE_WIDTH = 360;
const TITLE_LINES = 4;
const MIN_TITLE_SIZE = 28;

// satori cannot measure text ahead, so lines are estimated with Latin at 0.55em and CJK at 1em.
function titleSize(chunks: string[], base: number) {
  const widths = chunks.map((chunk) => {
    const narrow = chunk.match(/[ -\u2fff]/g)?.length ?? 0;
    return narrow * 0.55 + (chunk.length - narrow);
  });
  for (let size = base; size > MIN_TITLE_SIZE; size -= 4) {
    let lines = 1;
    let used = 0;
    for (const width of widths) {
      if (used > 0 && used + width * size > TITLE_WIDTH) {
        lines += 1;
        used = 0;
      }
      used += width * size;
    }
    if (lines <= TITLE_LINES) {
      return size;
    }
  }
  return MIN_TITLE_SIZE;
}

function Mark({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        border: `${size / 6}px solid ${IRIS}`,
        borderRadius: (size * 12) / 60,
      }}
    />
  );
}

function Diagram(props: { src: string | null; width: number; height: number; radius: number }) {
  const { src, width, height, radius } = props;
  return src ? (
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      style={{ objectFit: "cover", borderRadius: radius }}
    />
  ) : (
    <div style={{ display: "flex", width, height, borderRadius: radius, backgroundColor: PAPER }} />
  );
}

function Card({ style, children }: { style: CSSProperties; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 32,
        backgroundColor: PAPER,
        color: INK,
        fontFamily: LATIN_FIRST,
      }}
    >
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          overflow: "hidden",
          borderRadius: 48,
          backgroundColor: IRIS_TINT,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const SHOT_GAP = 14;
const SHOT_WIDTH = (OG_SIZE.width - 2 * 32 - 2 * 64 - 2 * SHOT_GAP) / 3;

/** The wordmark over three diagrams; a missing preview leaves its slot blank. */
export function homeImage(previews: (string | null)[]) {
  const slots = [0, 1, 2].map((index) => previews[index] ?? null);
  return {
    element: (
      <Card style={{ flexDirection: "column", justifyContent: "space-between", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Mark size={60} />
            <div style={{ display: "flex", fontSize: 84, fontWeight: 900, lineHeight: 0.95 }}>
              {WORDMARK}
            </div>
          </div>
          <div
            style={{ display: "flex", width: 700, fontSize: 30, fontWeight: 500, lineHeight: 1.4 }}
          >
            {LEAD}
          </div>
        </div>
        <div style={{ display: "flex", gap: SHOT_GAP }}>
          {slots.map((src, index) => (
            <div
              key={index}
              style={{ display: "flex", padding: 5, borderRadius: 20, backgroundColor: SURFACE }}
            >
              <Diagram src={src} width={SHOT_WIDTH - 10} height={181} radius={15} />
            </div>
          ))}
        </div>
      </Card>
    ),
    fonts: loadFonts([
      [900, WORDMARK],
      [500, LEAD],
    ]),
  };
}

export function stackImage(stack: { title: string; name: string; preview: string | null }) {
  const chunks = splitPhrases(stack.title);
  const cjk = CJK.test(stack.title);
  const fontSize = titleSize(chunks, cjk ? 40 : 52);
  const lineHeight = cjk ? 1.3 : 1.15;
  const byline = `by ${stack.name}`;
  return {
    element: (
      <Card style={{ alignItems: "center", gap: 32, padding: 48 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexShrink: 0,
            width: TITLE_WIDTH,
            height: 470,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16.8px 26.4px",
              borderRadius: 999,
              backgroundColor: SURFACE,
            }}
          >
            <Mark size={28.8} />
            <div style={{ display: "flex", fontSize: 26.4, fontWeight: 800, lineHeight: 1 }}>
              {WORDMARK}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              width: TITLE_WIDTH,
              maxHeight: TITLE_LINES * fontSize * lineHeight,
              overflow: "hidden",
              fontFamily: cjk ? CJK_FIRST : LATIN_FIRST,
              fontSize,
              fontWeight: 700,
              lineHeight,
            }}
          >
            {chunks.map((chunk, index) => (
              <span key={index}>{chunk}</span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: TITLE_WIDTH,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {byline.replaceAll(" ", NBSP)}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            padding: 10,
            borderRadius: 28,
            backgroundColor: SURFACE,
          }}
        >
          <Diagram src={stack.preview} width={608} height={347} radius={18} />
        </div>
      </Card>
    ),
    fonts: loadFonts([
      [800, WORDMARK],
      [700, `${stack.title}${byline}`],
    ]),
  };
}
