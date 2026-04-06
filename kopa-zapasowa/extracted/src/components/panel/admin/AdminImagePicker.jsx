import AdminMediaPicker from './AdminMediaPicker';

export default function AdminImagePicker({ label, value, onChange, helperText = '' }) {
  return (
    <AdminMediaPicker
      label={label}
      value={value}
      onChange={onChange}
      helperText={helperText}
      allowedKinds={['image']}
      accept="image/*"
      emptyStateText="Brak wybranego obrazka."
      currentValueLabel="Aktualnie wybrany obrazek"
      removeLabel="Usuń obrazek"
      libraryDescription="Wybierz istniejący obrazek bez rozwijania akordeonu pod formularzem."
      uploadButtonLabel="Wgraj z komputera"
    />
  );
}