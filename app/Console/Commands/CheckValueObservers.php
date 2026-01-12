<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ValueObserverService;

class CheckValueObservers extends Command
{
    protected $signature = 'observers:check';
    protected $description = 'Check all active value observers';

    protected $observerService;

    public function __construct(ValueObserverService $observerService)
    {
        parent::__construct();
        $this->observerService = $observerService;
    }

    public function handle()
    {
        \Log::info('karnot');
        $this->info('Starting value observer checks...');

        $startTime = microtime(true);
        $this->observerService->runObservers();

        $elapsedTime = round(microtime(true) - $startTime, 2);
        $this->info("Value observer checks completed in {$elapsedTime}s");

        return Command::SUCCESS;
    }
}
