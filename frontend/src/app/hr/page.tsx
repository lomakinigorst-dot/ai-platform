import AppShell from '@/components/layout/AppShell';
import BlockLockedPage from '@/components/ui/block-locked-page';

export default function HRHomePage() {
  return (
    <AppShell>
      <BlockLockedPage
        blockId="hr"
        features={[
          'Создание и публикация вакансий',
          'AI-скрининг резюме и кандидатов',
          'Автоматическая воронка найма',
          'Тестирование навыков соискателей',
        ]}
      />
    </AppShell>
  );
}
