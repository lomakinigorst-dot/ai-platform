import AppShell from '@/components/layout/AppShell';
import BlockLockedPage from '@/components/ui/block-locked-page';

export default function LegalHomePage() {
  return (
    <AppShell>
      <BlockLockedPage
        blockId="legal"
        features={[
          'Анализ договоров на риски за 2 мин',
          'Проверка контрагентов по реестрам',
          'История проверок и отчёты',
          'Аналитика правовых рисков',
        ]}
      />
    </AppShell>
  );
}
