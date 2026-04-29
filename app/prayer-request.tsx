import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FadeInView } from '@/components/fade-in-view';
import { InteractivePressable } from '@/components/interactive-pressable';
import { KeyboardSafeScrollView } from '@/components/keyboard-safe-scroll-view';
import { supabase } from '@/lib/supabase';
import { getFriendlyActionErrorMessage } from '@/lib/user-facing-error';

const categories = ['Healing', 'Family', 'Breakthrough', 'Guidance', 'Thanksgiving'];
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function PrayerRequestScreen() {
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Healing');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async () => {
    if (submitStatus === 'submitting') {
      return;
    }

    const trimmedFullName = fullName.trim();
    const trimmedContact = contact.trim();
    const trimmedMessage = message.trim();
    const savedFullName = isAnonymous ? 'Anonymous' : trimmedFullName;

    if (!isAnonymous && !trimmedFullName) {
      setSubmitStatus('error');
      setStatusMessage('Please enter your full name before submitting your prayer request.');
      return;
    }

    if (!isAnonymous && !trimmedContact) {
      setSubmitStatus('error');
      setStatusMessage('Please add a phone number or email so the team can follow up with you.');
      return;
    }

    if (!trimmedMessage) {
      setSubmitStatus('error');
      setStatusMessage('Please share your prayer request message before submitting.');
      return;
    }

    setSubmitStatus('submitting');
    setStatusMessage('');

    try {
      const { error } = await supabase.from('prayer_requests').insert({
        full_name: savedFullName,
        contact: trimmedContact || null,
        category: selectedCategory,
        message: trimmedMessage,
        is_anonymous: isAnonymous,
      });

      if (error) {
        throw error;
      }

      setFullName('');
      setContact('');
      setSelectedCategory('Healing');
      setMessage('');
      setIsAnonymous(false);
      setSubmitStatus('success');
      setStatusMessage('Your prayer request has been submitted successfully. We are standing with you in prayer.');
    } catch (error) {
      console.error('Failed to submit prayer request.', error);
      setSubmitStatus('error');
      setStatusMessage(getFriendlyActionErrorMessage(
        error,
        'Something went wrong while submitting your request. Please try again in a moment.'
      ));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardSafeScrollView contentContainerStyle={styles.content}>
        <FadeInView>
          <View style={styles.header}>
            <Text style={styles.title}>Prayer Request</Text>
            <Text style={styles.subtitle}>Share your prayer needs with faith</Text>
          </View>

          <View style={styles.noteCard}>
            <Ionicons name="heart-outline" size={20} color="#0A2E73" />
            <Text style={styles.noteText}>
              We believe God answers prayers. Your request will be treated with care.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                autoCapitalize="words"
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#8C919C"
                style={styles.input}
                value={fullName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone or Email</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setContact}
                placeholder={isAnonymous ? 'Optional: enter your phone or email' : 'Enter your phone or email'}
                placeholderTextColor="#8C919C"
                style={styles.input}
                value={contact}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Prayer Category</Text>
              <View style={styles.categoryList}>
                {categories.map((category) => {
                  const selected = category === selectedCategory;

                  return (
                    <InteractivePressable
                      key={category}
                      accessibilityRole="button"
                      onPress={() => setSelectedCategory(category)}
                      scaleTo={0.98}
                      style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
                      <Text
                        style={[
                          styles.categoryChipText,
                          selected && styles.categoryChipTextSelected,
                        ]}>
                        {category}
                      </Text>
                    </InteractivePressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Prayer Request</Text>
              <TextInput
                multiline
                numberOfLines={5}
                onChangeText={setMessage}
                placeholder="Share your prayer request here..."
                placeholderTextColor="#8C919C"
                scrollEnabled={false}
                style={styles.messageBox}
                textAlignVertical="top"
                value={message}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.label}>Anonymous Request</Text>
                <Text style={styles.toggleHint}>Submit this request without showing your name.</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#CAD3E3', true: '#6C89C8' }}
                thumbColor={isAnonymous ? '#0A2E73' : '#FFFFFF'}
              />
            </View>

            {submitStatus !== 'idle' ? (
              <View
                style={[
                  styles.feedbackCard,
                  submitStatus === 'success' ? styles.feedbackCardSuccess : styles.feedbackCardError,
                ]}>
                <Ionicons
                  name={submitStatus === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                  size={18}
                  color={submitStatus === 'success' ? '#0D6B3E' : '#A43A3A'}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    submitStatus === 'success' ? styles.feedbackTextSuccess : styles.feedbackTextError,
                  ]}>
                  {statusMessage}
                </Text>
              </View>
            ) : null}

            <InteractivePressable
              accessibilityRole="button"
              activeOpacity={0.9}
              onPress={() => {
                void handleSubmit();
              }}
              scaleTo={submitStatus === 'submitting' ? 1 : 0.98}
              style={[styles.submitButton, submitStatus === 'submitting' && styles.submitButtonDisabled]}>
              {submitStatus === 'submitting' ? (
                <View style={styles.submitContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </InteractivePressable>
          </View>
        </FadeInView>
      </KeyboardSafeScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A2E73',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5E739B',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF3FC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#31476E',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    shadowColor: '#0A2E73',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
    gap: 18,
  },
  field: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7E2F7',
    borderRadius: 16,
    backgroundColor: '#FBFCFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111111',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#D7E2F7',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFF',
  },
  categoryChipSelected: {
    backgroundColor: '#0A2E73',
    borderColor: '#0A2E73',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#31476E',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  messageBox: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#D7E2F7',
    borderRadius: 18,
    backgroundColor: '#FBFCFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 22,
    color: '#111111',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E3EAF6',
    gap: 16,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleHint: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6E7D96',
    marginTop: 4,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  feedbackCardSuccess: {
    backgroundColor: '#EAF8F0',
    borderWidth: 1,
    borderColor: '#BEE4CD',
  },
  feedbackCardError: {
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#F2C7C7',
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  feedbackTextSuccess: {
    color: '#0D6B3E',
  },
  feedbackTextError: {
    color: '#A43A3A',
  },
  submitButton: {
    backgroundColor: '#0A2E73',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A2E73',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.88,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
