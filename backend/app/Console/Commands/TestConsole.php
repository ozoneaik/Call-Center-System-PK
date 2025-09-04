<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class TestConsole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'log:testConsole {--name=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'cli for test show';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $name = $this->option('name');
        if($this->confirm("What is your name?")){
            $this->info('Hello, '.$name);
            $this->table(['Name','Email'],User::all(['name','email'])->toArray());
        }


        while (true) {
            $this->info('hello');
            sleep(5);
        }
    }
}
