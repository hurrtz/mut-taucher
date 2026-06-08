<?php

declare(strict_types=1);

require_once __DIR__ . '/../slots.php';

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

/**
 * Website bookings must not be possible for the current day or the next day;
 * the earliest bookable date is the day after tomorrow. The cutoff lives in
 * generateSlots() so it applies to both slot listing and booking validation.
 */
final class SlotLeadTimeTest extends TestCase
{
    private function makeDb(): PDO
    {
        $db = new PDO('sqlite::memory:');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        $db->exec('CREATE TABLE recurring_rules (id INTEGER PRIMARY KEY, label TEXT DEFAULT "", time TEXT, duration_minutes INTEGER, start_date TEXT, end_date TEXT)');
        $db->exec('CREATE TABLE rule_days (id INTEGER PRIMARY KEY, rule_id INTEGER, day_of_week INTEGER, frequency TEXT DEFAULT "weekly")');
        $db->exec('CREATE TABLE rule_exceptions (id INTEGER PRIMARY KEY, rule_id INTEGER, exception_date TEXT)');
        $db->exec('CREATE TABLE bookings (id INTEGER PRIMARY KEY, rule_id INTEGER, event_id INTEGER, booking_date TEXT, booking_time TEXT, status TEXT)');
        $db->exec('CREATE TABLE events (id INTEGER PRIMARY KEY, event_date TEXT, time TEXT, duration_minutes INTEGER, price_cents INTEGER)');

        // A rule that is active on every weekday, so each date in range yields a slot.
        $db->exec("INSERT INTO recurring_rules (id, time, duration_minutes, start_date, end_date) VALUES (1, '10:00', 50, '2020-01-01', '2030-12-31')");
        for ($dow = 1; $dow <= 7; $dow++) {
            $db->exec("INSERT INTO rule_days (rule_id, day_of_week, frequency) VALUES (1, $dow, 'weekly')");
        }

        return $db;
    }

    /** @return string[] sorted list of slot dates */
    private function slotDates(PDO $db): array
    {
        $from = date('Y-m-d');
        $to   = date('Y-m-d', strtotime('+5 days'));
        return array_column(generateSlots($db, $from, $to), 'date');
    }

    #[Test]
    public function it_excludes_today_and_tomorrow_from_recurring_slots(): void
    {
        $dates = $this->slotDates($this->makeDb());

        $this->assertNotContains(date('Y-m-d'), $dates, 'today must not be bookable');
        $this->assertNotContains(date('Y-m-d', strtotime('+1 day')), $dates, 'tomorrow must not be bookable');
    }

    #[Test]
    public function it_allows_the_day_after_tomorrow_onwards(): void
    {
        $dates = $this->slotDates($this->makeDb());

        $this->assertContains(date('Y-m-d', strtotime('+2 days')), $dates, 'day after tomorrow must be bookable');
        $this->assertContains(date('Y-m-d', strtotime('+3 days')), $dates);
    }

    #[Test]
    public function it_applies_the_same_cutoff_to_one_off_events(): void
    {
        $db = $this->makeDb();
        $db->exec("INSERT INTO events (id, event_date, time, duration_minutes) VALUES (1, '" . date('Y-m-d', strtotime('+1 day')) . "', '14:00', 50)");
        $db->exec("INSERT INTO events (id, event_date, time, duration_minutes) VALUES (2, '" . date('Y-m-d', strtotime('+2 days')) . "', '14:00', 50)");

        $eventIds = array_column(generateSlots($db, date('Y-m-d'), date('Y-m-d', strtotime('+5 days'))), 'eventId');
        $eventIds = array_filter($eventIds, fn($v) => $v !== null);

        $this->assertNotContains(1, $eventIds, 'event tomorrow must not be bookable');
        $this->assertContains(2, $eventIds, 'event the day after tomorrow must be bookable');
    }
}
