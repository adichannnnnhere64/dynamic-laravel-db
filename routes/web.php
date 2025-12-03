<?php

use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {

        $user = auth()->user()->load('dbConnections');
        /* dd($user->dbConnection); */

        if ($user->dbConnection) {
            return redirect()->route('product.index');
        }

        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth'])->group(function () {

    Route::get('/connect', function () {
        $user = auth()->user()->load('dbConnections');

        if ($user->dbConnection) {
            return redirect()->route('product.index');
        }

        return Inertia::render('Connection/Index');
    })->name('connect.page');


    Route::get('/product/search', [ProductController::class, 'index'])->name('product.search');

    Route::post('/connect', [ProductController::class, 'connect'])->name('connect');
    /* Route::get('/disconnect', [ProductController::class, 'disconnect'])->name('disconnect'); */
    Route::delete('/connect/{id}', [ProductController::class, 'disconnect']);

    Route::get('/product', [ProductController::class, 'index'])->name('product.index');
    Route::get('/product/create', [ProductController::class, 'create'])->name('product.create');
    Route::post('/product/store', [ProductController::class, 'store'])->name('product.store');
    Route::post('/product/search', [ProductController::class, 'findProduct'])->name('product.search.post');
    Route::post('/product/update', [ProductController::class, 'updateProduct'])->name('product.update');
    Route::delete('/product/delete', [ProductController::class, 'deleteProduct'])->name('product.delete');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
