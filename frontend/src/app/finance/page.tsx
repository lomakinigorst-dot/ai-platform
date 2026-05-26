import AppShell from '@/components/layout/AppShell';
import BlockLockedPage from '@/components/ui/block-locked-page';

export default function FinanceHomePage() {
  return (
    <AppShell>
      <BlockLockedPage
        blockId="finance"
        features={[
          'P&L — отчёт о прибылях и убытках',
          'ДДС — движение денежных средств',
          'Подключение банковских счетов',
          'Платёжный календарь и прогноз',
        ]}
      />
    </AppShell>
  );
}
