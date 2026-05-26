import AppShell from '@/components/layout/AppShell';
import BlockLockedPage from '@/components/ui/block-locked-page';

export default function SalesHomePage() {
  return (
    <AppShell>
      <BlockLockedPage
        blockId="sales"
        features={[
          'Тренировочные звонки с AI-клиентом',
          'Анализ реальных звонков и записей',
          'Генерация и улучшение скриптов',
          'Аналитика эффективности продаж',
        ]}
      />
    </AppShell>
  );
}
