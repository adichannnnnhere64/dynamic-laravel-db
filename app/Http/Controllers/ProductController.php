<?php

namespace App\Http\Controllers;

use App\Services\DynamicDatabaseService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected $db;

    public function __construct(DynamicDatabaseService $db)
    {
        $this->db = $db;
    }

    public function connect(Request $request)
    {
        $request->validate([
            'host' => 'required|string',
            'port' => 'required|integer',
            'database' => 'required|string',
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = $request->user();

        // Store or update user’s DB connection
        $connection = $user->dbConnection()->updateOrCreate(
            ['user_id' => $user->id],
            $request->only(['host', 'port', 'database', 'username', 'password'])
        );

        return redirect()->route('product.index')
            ->with('success', 'Database connection saved successfully.');
    }

    public function disconnect(Request $request)
    {
        $user = $request->user();

        $user->dbConnection()->delete();

        return redirect()->route('dashboard')
            ->with('success', 'Database disconnected successfully.');
    }

    public function index(Request $request)
    {
        $conn = $this->db->connect($this->getUserConnection());
        $table = config('products.table');

        try {
            $query = $conn->table($table);

            if ($search = $request->get('search')) {
                $query->where(function ($q) use ($search) {
                    foreach (config('products.fields') as $field) {
                        $q->orWhere($field, 'like', "%{$search}%");
                    }
                });
            }

            $products = $query->paginate(10)->withQueryString();

            return inertia('Product/Index', [
                'products' => $products,
                'idField' => config('products.primary_key'),
                'fields' => config('products.fields'),
            ]);
        } catch (\Exception) {
            auth()->user()->dbConnection()->delete();

            return redirect()->route('connect');
        }
    }

    public function findProduct(Request $request)
    {

        $idField = config('products.primary_key');
        $validated = $request->validate([
            $idField => 'required|string',
        ]);

        $table = config('products.table');
        $idField = config('products.primary_key');
        /* dd($validated) */

        $conn = $this->db->connect($this->getUserConnection());
        $product = $conn->table($table)
            ->where($idField, $validated[$idField])
            ->first();

        return inertia('Product/Show', [
            'product' => $product,
            'editableFields' => config('products.editable'),
            'inputs' => config('products.inputs'),
            'idField' => config('products.primary_key'),
        ]);
    }

    public function updateProduct(Request $request)
{
    $editable = config('products.editable');
    $validations = config('products.validations');
    $idField = config('products.primary_key');
    $table = config('products.table');

    // only validate editable fields + primary key
    $rules = collect($editable)
        ->mapWithKeys(fn ($field) => [$field => $validations[$field] ?? 'nullable'])
        ->toArray();

    $rules[$idField] = $validations[$idField] ?? 'required|string';

    $validated = $request->validate($rules);

    $conn = $this->db->connect($this->getUserConnection());

    $conn->table($table)
        ->where($idField, $validated[$idField]) // 👈 dynamic
        ->update(collect($validated)->only($editable)->toArray());

    return to_route('product.index')->with('success', 'Product updated');
}

     private function getUserConnection()
    {
        if (auth()->user()->dbConnection == null) {
            return [];
        }

        return auth()->user()->dbConnection->toArray();
    }

    public function create()
    {
        return inertia('Product/Create', [
            'editableFields' => config('products.editable'),
            'inputs' => config('products.inputs'),
            'idField' => config('products.primary_key'),
        ]);
    }

    public function store(Request $request)
    {
        $editable = config('products.editable');
        $validations = config('products.validations');
        $idField = config('products.primary_key');
        $table = config('products.table');

        // Build validation rules
        $rules = collect($editable)
            ->mapWithKeys(fn ($field) => [$field => $validations[$field] ?? 'nullable'])
            ->toArray();

        $rules[$idField] = $validations[$idField] ?? 'required|string|unique:'.$table.','.$idField;

        $validated = $request->validate($rules);

        $conn = $this->db->connect($this->getUserConnection());
        $conn->table($table)->insert($validated);

        return to_route('product.index')->with('success', 'Product created successfully');
    }
}
