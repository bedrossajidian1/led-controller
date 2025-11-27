// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:led_controller_flutter/main.dart';

void main() {
  testWidgets('LED Controller app loads correctly', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const LEDControllerApp());

    // Verify that the app title is present.
    expect(find.text('🔆 LED Controller'), findsOneWidget);

    // Verify that basic controls are present.
    expect(find.text('ON'), findsOneWidget);
    expect(find.text('OFF'), findsOneWidget);
    expect(find.text('TOGGLE'), findsOneWidget);

    // Verify that brightness control is present.
    expect(find.text('Brightness (PWM)'), findsOneWidget);
  });
}
