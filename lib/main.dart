import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() => runApp(const FitApp());

class FitApp extends StatelessWidget {
  const FitApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'FitLog',
        theme: ThemeData(colorSchemeSeed: Colors.teal, useMaterial3: true),
        home: const Home(),
      );
}

class Workout {
  final String type;
  final int minutes;
  final DateTime date;
  Workout(this.type, this.minutes, this.date);
  Map<String, dynamic> toJson() =>
      {'t': type, 'm': minutes, 'd': date.toIso8601String()};
  factory Workout.fromJson(Map<String, dynamic> j) =>
      Workout(j['t'], j['m'], DateTime.parse(j['d']));
}

class Home extends StatefulWidget {
  const Home({super.key});
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  static const goal = 30;
  static const types = ['Run', 'Walk', 'Cycle', 'Gym', 'Yoga', 'Swim'];
  List<Workout> items = [];
  SharedPreferences? prefs;

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((p) {
      prefs = p;
      final raw = p.getStringList('w') ?? [];
      setState(() => items =
          raw.map((e) => Workout.fromJson(jsonDecode(e))).toList());
    });
  }

  void save() => prefs?.setStringList(
      'w', items.map((e) => jsonEncode(e.toJson())).toList());

  bool isToday(DateTime d) {
    final n = DateTime.now();
    return d.year == n.year && d.month == n.month && d.day == n.day;
  }

  int get today =>
      items.where((w) => isToday(w.date)).fold(0, (a, w) => a + w.minutes);

  Future<void> add() async {
    String type = types.first;
    final ctrl = TextEditingController(text: '30');
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (c, set) => AlertDialog(
          title: const Text('Log workout'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButton<String>(
              value: type,
              isExpanded: true,
              items: types
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (v) => set(() => type = v!),
            ),
            TextField(
              controller: ctrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Minutes'),
            ),
          ]),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(c, false),
                child: const Text('Cancel')),
            FilledButton(
                onPressed: () => Navigator.pop(c, true),
                child: const Text('Add')),
          ],
        ),
      ),
    );
    final m = int.tryParse(ctrl.text);
    if (ok == true && m != null && m > 0) {
      setState(() => items.insert(0, Workout(type, m, DateTime.now())));
      save();
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = (today / goal).clamp(0.0, 1.0);
    return Scaffold(
      appBar: AppBar(title: const Text('FitLog')),
      floatingActionButton: FloatingActionButton(
          onPressed: add, child: const Icon(Icons.add)),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(24),
          child: Column(children: [
            SizedBox(
              height: 140,
              width: 140,
              child: Stack(alignment: Alignment.center, children: [
                SizedBox.expand(
                    child: CircularProgressIndicator(
                        value: progress, strokeWidth: 10)),
                Text('$today / $goal min',
                    style: Theme.of(context).textTheme.titleMedium),
              ]),
            ),
            const SizedBox(height: 8),
            Text(today >= goal ? 'Goal reached! 🎉' : "Today's goal"),
          ]),
        ),
        const Divider(height: 1),
        Expanded(
          child: items.isEmpty
              ? const Center(child: Text('No workouts yet. Tap + to add one.'))
              : ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (c, i) {
                    final w = items[i];
                    return Dismissible(
                      key: ValueKey(w.date.toIso8601String() + i.toString()),
                      background: Container(color: Colors.red),
                      onDismissed: (_) {
                        setState(() => items.removeAt(i));
                        save();
                      },
                      child: ListTile(
                        leading: const Icon(Icons.fitness_center),
                        title: Text('${w.type} · ${w.minutes} min'),
                        subtitle: Text(
                            '${w.date.day}/${w.date.month}/${w.date.year}'),
                      ),
                    );
                  },
                ),
        ),
      ]),
    );
  }
}
