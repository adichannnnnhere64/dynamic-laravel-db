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

        try {
            $query = $conn->table('products');

            if ($search = $request->get('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('product_code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('age', 'like', "%{$search}%")
                        ->orWhere('country', 'like', "%{$search}%");
                });
            }

            $products = $query->paginate(10)->withQueryString();

            return inertia('Product/Index', [
                'products' => $products,
            ]);

        } catch (\Exception) {
            return redirect()->route('dashboard');
        }
    }

    public function findProduct(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
        ]);

        $conn = $this->db->connect($this->getUserConnection());
        $product = $conn->table('products')->where('product_code', $validated['code'])->first();

        return inertia('Product/Show', ['product' => $product]);
    }

    public function updateProduct(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'name' => 'required|string',
            'age' => 'required|integer',
            'country' => 'required|string',
        ]);

        $conn = $this->db->connect($this->getUserConnection());

        $conn->table('products')
            ->where('product_code', $validated['code'])
            ->update([
                'name' => $validated['name'],
                'age' => $validated['age'],
                'country' => $validated['country'],
            ]);

        return to_route('product.index')->with('success', 'Product updated');
    }

    private function getUserConnection()
    {
        if (auth()->user()->dbConnection == null) {
            return [];
        }

        return auth()->user()->dbConnection->toArray();
    }
}
