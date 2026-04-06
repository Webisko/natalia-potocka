function getConfig(kind) {
  if (kind === 'description') {
    return {
      idealMin: 150,
      idealMax: 160,
      warnMin: 70,
      warnMax: 160,
      labels: {
        short: 'Opis jest zbyt krótki',
        long: 'Opis jest zbyt długi',
        warnShort: 'Opis może być jeszcze dłuższy',
        warnLong: 'Opis jest już na granicy ucięcia',
        ideal: 'Długość opisu jest optymalna',
      },
      helperText: 'Celuj w 150-160 znaków. Bezpieczny zakres roboczy to 70-155 znaków.',
    };
  }

  return {
    idealMin: 50,
    idealMax: 60,
    warnMin: 35,
    warnMax: 60,
    labels: {
      short: 'Tytuł jest zbyt krótki',
      long: 'Tytuł jest zbyt długi',
      warnShort: 'Tytuł może być trochę dłuższy',
      warnLong: 'Tytuł jest już na granicy ucięcia',
      ideal: 'Długość tytułu jest optymalna',
    },
    helperText: 'Celuj w 50-60 znaków. Dłuższe tytuły Google może uciąć lub podmienić.',
  };
}

function getFeedback(length, kind) {
  const config = getConfig(kind);

  if (length < config.warnMin) {
    return {
      tone: 'bad',
      label: config.labels.short,
      barClassName: 'bg-rose',
      textClassName: 'text-rose',
    };
  }

  if (length < config.idealMin) {
    return {
      tone: 'warn',
      label: config.labels.warnShort,
      barClassName: 'bg-amber-500',
      textClassName: 'text-amber-700',
    };
  }

  if (length <= config.idealMax) {
    return {
      tone: 'good',
      label: config.labels.ideal,
      barClassName: 'bg-emerald-500',
      textClassName: 'text-emerald-700',
    };
  }

  if (length <= config.warnMax) {
    return {
      tone: 'warn',
      label: config.labels.warnLong,
      barClassName: 'bg-amber-500',
      textClassName: 'text-amber-700',
    };
  }

  return {
    tone: 'bad',
    label: config.labels.long,
    barClassName: 'bg-rose',
    textClassName: 'text-rose',
  };
}

export default function SeoLengthIndicator({ value = '', kind = 'title', type }) {
  const resolvedKind = type || kind;
  const text = `${value || ''}`;
  const length = text.trim().length;
  const config = getConfig(resolvedKind);
  const feedback = getFeedback(length, resolvedKind);
  const progress = Math.max(0, Math.min(100, (length / (config.warnMax + 10)) * 100));

  return (
    <div className="mt-2 space-y-2 rounded-2xl border border-mauve/10 bg-white/80 px-4 py-3">
      <div className="flex items-center justify-between gap-4 text-fs-ui">
        <span className={`font-semibold ${feedback.textClassName}`}>{feedback.label}</span>
        <span className="font-bold text-mauve/55">{length} znaków</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-mauve/10">
        <div className={`h-full rounded-full transition-all ${feedback.barClassName}`} style={{ width: `${progress}%` }} />
      </div>
      <p className="text-fs-ui leading-6 text-mauve/55">
        {config.helperText}
      </p>
    </div>
  );
}