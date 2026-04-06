import DatePicker, { registerLocale } from 'react-datepicker';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pl', pl);

function parseDateTimeValue(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = `${value}`.trim().replace(' ', 'T');
  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTimeValue(value) {
  if (!value) {
    return '';
  }

  return format(value, "yyyy-MM-dd'T'HH:mm");
}

export default function AdminDateTimeField({ label, value, onChange, helperText = 'Format polski: dd.mm.rrrr, godz. gg:mm.', placeholder = 'dd.mm.rrrr gg:mm' }) {
  return (
    <div>
      <label className="mb-1 block text-fs-label font-bold uppercase tracking-[0.18em] text-mauve/55">{label}</label>
      <DatePicker
        selected={parseDateTimeValue(value)}
        onChange={(nextValue) => onChange(formatDateTimeValue(nextValue))}
        showTimeSelect
        timeIntervals={15}
        timeCaption="Godzina"
        dateFormat="dd.MM.yyyy HH:mm"
        locale="pl"
        placeholderText={placeholder}
        calendarStartDay={1}
        popperPlacement="bottom-start"
        wrapperClassName="admin-datepicker-wrapper"
        className="admin-datepicker-input w-full rounded-2xl border border-mauve/15 bg-white px-4 py-3 text-fs-body text-mauve focus:outline-none focus:ring-2 focus:ring-gold/20"
      />
      {helperText ? <p className="mt-2 text-fs-ui leading-6 text-mauve/55">{helperText}</p> : null}
    </div>
  );
}