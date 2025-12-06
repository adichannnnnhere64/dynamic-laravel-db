<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('value_observers', function (Blueprint $table) {
            $table->json('telegram_chat_ids')->nullable()->after('notification_emails');
            $table->string('telegram_bot_token')->nullable()->after('telegram_chat_ids');
        });
    }

    public function down(): void
    {
        Schema::table('value_observers', function (Blueprint $table) {
            $table->dropColumn(['telegram_chat_ids', 'telegram_bot_token']);
        });
    }
};
