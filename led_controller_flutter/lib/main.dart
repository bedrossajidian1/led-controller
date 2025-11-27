import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';

void main() {
  runApp(const LEDControllerApp());
}

class LEDControllerApp extends StatelessWidget {
  const LEDControllerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LED Controller',
      theme: ThemeData(
        primarySwatch: Colors.deepPurple,
        useMaterial3: true,
      ),
      home: const LEDControllerHome(),
    );
  }
}

class LEDControllerHome extends StatefulWidget {
  const LEDControllerHome({super.key});

  @override
  State<LEDControllerHome> createState() => _LEDControllerHomeState();
}

class _LEDControllerHomeState extends State<LEDControllerHome> {
  // CHANGE THIS TO YOUR RASPBERRY PI'S IP ADDRESS
  String piIP = '192.168.1.100';
  
  bool isOn = false;
  String mode = 'off';
  int brightness = 100;
  int pin = 17;
  bool connected = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    fetchState();
    _pollTimer = Timer.periodic(const Duration(seconds: 2), (_) => fetchState());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  String get apiUrl => 'http://$piIP:3001/api/led';

  Future<void> fetchState() async {
    try {
      final response = await http.get(Uri.parse('$apiUrl/state')).timeout(
        const Duration(seconds: 3),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          isOn = data['isOn'];
          mode = data['mode'];
          brightness = data['brightness'];
          pin = data['pin'];
          connected = true;
        });
      }
    } catch (e) {
      setState(() => connected = false);
      debugPrint('Error: $e');
    }
  }

  Future<void> apiCall(String endpoint, [Map<String, dynamic>? body]) async {
    try {
      await http.post(
        Uri.parse('$apiUrl/$endpoint'),
        headers: {'Content-Type': 'application/json'},
        body: body != null ? json.encode(body) : null,
      );
      await fetchState();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to communicate with LED controller')),
        );
      }
    }
  }

  void showIPDialog() {
    final controller = TextEditingController(text: piIP);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Raspberry Pi IP Address'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: '192.168.1.100'),
          keyboardType: TextInputType.number,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() => piIP = controller.text);
              Navigator.pop(context);
              fetchState();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🔆 LED Controller'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          Icon(
            Icons.circle,
            color: connected ? Colors.green : Colors.red,
            size: 16,
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: showIPDialog,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // LED Display
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isOn ? Colors.yellow : Colors.grey[300],
                        border: Border.all(
                          color: isOn ? Colors.yellow[700]! : Colors.grey,
                          width: 4,
                        ),
                        boxShadow: isOn
                            ? [
                                BoxShadow(
                                  color: Colors.yellow.withOpacity(0.5),
                                  blurRadius: 40,
                                  spreadRadius: 10,
                                ),
                              ]
                            : null,
                      ),
                      child: Center(
                        child: Text(
                          isOn ? '💡' : '◯',
                          style: const TextStyle(fontSize: 60),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text('Mode: $mode', style: const TextStyle(fontSize: 16)),
                    Text('Brightness: $brightness%', style: const TextStyle(fontSize: 16)),
                    Text('Pin: GPIO $pin', style: const TextStyle(fontSize: 16)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Basic Controls
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Basic Controls', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => apiCall('on'),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                            child: const Text('ON'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => apiCall('off'),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                            child: const Text('OFF'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => apiCall('toggle'),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple),
                            child: const Text('TOGGLE'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Brightness
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Brightness (PWM)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Slider(
                            value: brightness.toDouble(),
                            min: 0,
                            max: 100,
                            divisions: 100,
                            label: '$brightness%',
                            onChanged: (value) {
                              setState(() => brightness = value.toInt());
                            },
                            onChangeEnd: (value) {
                              apiCall('brightness', {'brightness': value.toInt()});
                            },
                          ),
                        ),
                        Text('$brightness%', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Modes
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Modes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildModeButton('🔆', 'Solid', 'on', null),
                        _buildModeButton('✨', 'Blink', 'blink', {'speed': 500}),
                        _buildModeButton('⚡', 'Pulse', 'pulse', {'speed': 100}),
                        _buildModeButton('🌊', 'Breathe', 'breathe', {'duration': 2000}),
                        _buildModeButton('🆘', 'SOS', 'sos', null),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeButton(String emoji, String label, String modeValue, Map<String, dynamic>? params) {
    final isActive = mode == modeValue;
    return ElevatedButton(
      onPressed: () => apiCall('mode', {'mode': modeValue, ...?params}),
      style: ElevatedButton.styleFrom(
        backgroundColor: isActive ? Colors.deepPurple : Colors.grey[200],
        foregroundColor: isActive ? Colors.white : Colors.black,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}