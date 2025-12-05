<?php

namespace App\Http\Controllers;

use App\Models\ValueObserver;
use App\Models\ConnectionTable;
use App\Services\ValueObserverService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ValueObserverController extends Controller
{
    protected $observerService;

    public function __construct(ValueObserverService $observerService)
    {
        $this->observerService = $observerService;
    }

    /**
     * Display a listing of observers
     */
    public function index(Request $request)
    {
        $observers = ValueObserver::with(['connectionTable.connection'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('field_to_watch', 'like', "%{$search}%");
            })
            ->when($request->connection_id, function ($query, $connectionId) {
                $query->whereHas('connectionTable', function ($q) use ($connectionId) {
                    $q->where('db_connection_id', $connectionId);
                });
            })
            ->orderBy('is_active', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        $connections = auth()->user()->dbConnections()->with('tables')->get();

        return Inertia::render('ValueObservers/Index', [
            'observers' => $observers,
            'connections' => $connections,
            'filters' => $request->only(['search', 'connection_id']),
        ]);
    }

    /**
     * Show form to create new observer
     */
    public function create(Request $request)
    {
        $connections = auth()->user()->dbConnections()->with('tables')->get();

        $selectedConnection = $connections->first();
        $selectedTable = $selectedConnection->tables->first();

        if ($request->connection_id) {
            $selectedConnection = $connections->find($request->connection_id);
            $selectedTable = $selectedConnection->tables->first();
        }

        if ($request->table_id) {
            $selectedTable = ConnectionTable::find($request->table_id);
            $selectedConnection = $selectedTable->connection;
        }

        // Get table fields for the selected table
        $fields = $selectedTable ? $selectedTable->fields : [];

        return Inertia::render('ValueObservers/Create', [
            'connections' => $connections,
            'selectedConnection' => $selectedConnection,
            'selectedTable' => $selectedTable,
            'fields' => $fields,
        ]);
    }

    /**
     * Store a new observer
     */
    public function store(Request $request)
    {
        $request->validate([
            'connection_table_id' => 'required|exists:connection_tables,id',
            'name' => 'required|string|max:255',
            'field_to_watch' => 'required|string|max:255',
            'condition_type' => 'required|in:less_than,greater_than,equals,not_equals,contains,starts_with,ends_with',
            'threshold_value' => 'nullable|numeric',
            'string_value' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'notification_emails' => 'required|array|min:1',
            'notification_emails.*' => 'email',
            'notification_subject' => 'required|string|max:255',
            'notification_message' => 'required|string',
            'check_interval_minutes' => 'required|integer|min:1|max:1440',
        ]);

        $observer = ValueObserver::create([
            'connection_table_id' => $request->connection_table_id,
            'name' => $request->name,
            'field_to_watch' => $request->field_to_watch,
            'condition_type' => $request->condition_type,
            'threshold_value' => $request->threshold_value,
            'string_value' => $request->string_value,
            'is_active' => $request->is_active ?? true,
            'notification_emails' => $request->notification_emails,
            'notification_subject' => $request->notification_subject,
            'notification_message' => $request->notification_message,
            'check_interval_minutes' => $request->check_interval_minutes,
        ]);

        return redirect()->route('value-observers.index')
            ->with('success', 'Value observer created successfully!');
    }

    /**
     * Show observer details
     */
    public function show(ValueObserver $observer)
    {
        $observer->load(['connectionTable.connection', 'logs' => function ($query) {
            $query->orderBy('created_at', 'desc')->limit(50);
        }]);

        return Inertia::render('ValueObservers/Show', [
            'observer' => $observer,
        ]);
    }

    /**
     * Edit observer
     */
    public function edit(ValueObserver $observer)
    {
        $observer->load('connectionTable.connection');
        $connections = auth()->user()->dbConnections()->with('tables')->get();

        $selectedConnection = $observer->connectionTable->connection;
        $selectedTable = $observer->connectionTable;

        return Inertia::render('ValueObservers/Edit', [
            'observer' => $observer,
            'connections' => $connections,
            'selectedConnection' => $selectedConnection,
            'selectedTable' => $selectedTable,
            'fields' => $selectedTable->fields,
        ]);
    }

    /**
     * Update observer
     */
    public function update(Request $request, ValueObserver $observer)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'field_to_watch' => 'required|string|max:255',
            'condition_type' => 'required|in:less_than,greater_than,equals,not_equals,contains,starts_with,ends_with',
            'threshold_value' => 'nullable|numeric',
            'string_value' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'notification_emails' => 'required|array|min:1',
            'notification_emails.*' => 'email',
            'notification_subject' => 'required|string|max:255',
            'notification_message' => 'required|string',
            'check_interval_minutes' => 'required|integer|min:1|max:1440',
        ]);

        $observer->update($request->all());

        return redirect()->route('value-observers.show', $observer)
            ->with('success', 'Value observer updated successfully!');
    }

    /**
     * Delete observer
     */
    public function destroy(ValueObserver $observer)
    {
        $observer->delete();

        return redirect()->route('value-observers.index')
            ->with('success', 'Value observer deleted successfully!');
    }

    /**
     * Test observer immediately
     */
    public function test(ValueObserver $observer)
    {
        $results = $this->observerService->testObserver($observer);

        return response()->json([
            'success' => true,
            'results' => $results,
            'total_records' => count($results),
            'condition_met_count' => count(array_filter($results, fn($r) => $r['condition_met'])),
        ]);
    }

    /**
     * Get fields for a table
     */
    public function getTableFields($tableId)
    {
        $table = ConnectionTable::findOrFail($tableId);

        return response()->json([
            'fields' => $table->fields,
        ]);
    }
}
