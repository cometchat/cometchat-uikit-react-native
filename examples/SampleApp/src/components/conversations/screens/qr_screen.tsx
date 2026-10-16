import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';
import { Animated, Easing } from 'react-native';
import Flash from '../../../assets/icons/Flash';
import sync from '../../../assets/icons/cometchat_sync_img.png';

interface ConfigData {
  data: {
    builderId: string;
    settings: any;
    name: string;
    type: string;
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
  };
}

const CONFIG_STORAGE_KEY = '@app_config';
const MINIMUM_LOADING_TIME = 5000;

const QRScreen: React.FC = () => {
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lineAnim] = useState(new Animated.Value(0));
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [loadingProgress] = useState(new Animated.Value(0));
  
  const apiResponseReceived = useRef(false);
  const loadingStartTime = useRef<number>(0);
  
  type ChatNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Conversation'
  >;
  const navigation = useNavigation<ChatNavigationProp>();
  
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !isLoading && !scannedCode) {
        const qrData = codes[0].value ?? '';
        setScannedCode(qrData);
        fetchDataFromAPI(qrData);
      }
    },
  });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [lineAnim]);

  const toggleFlash = () => {
    setIsFlashOn(prev => !prev);
  };

  useEffect(() => {
    const requestPermissions = async () => {
      let cameraStatus = await Camera.getCameraPermissionStatus();

      if (cameraStatus !== 'granted') {
        cameraStatus = await Camera.requestCameraPermission();
      }

      if (cameraStatus === 'granted') {
        setHasPermission(true);
      } else {
        Alert.alert(
          'Camera permission denied',
          'Please enable camera permission in your settings to scan QR codes'
        );
      }
    };

    requestPermissions();
  }, []);

  const saveConfigToStorage = async (configData: ConfigData) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configData));
      try {
        const { useConfigStore } = await import('../../../config/store');
        // Use the data property which contains the actual config structure
        useConfigStore.setState({ config: configData.data });        
        await AsyncStorage.setItem('@config_updated', 'true');
      } catch (importError) {
        console.log('Config store not available or failed to update:', importError);
      }

      return true;
    } catch (error) {
      console.error('Error saving config to AsyncStorage:', error);
      throw error;
    }
  };

  const finishLoading = () => {
    setIsLoading(false);
    navigation.goBack();
  };

  const fetchDataFromAPI = async (qrCodeData: string) => {
    try {
      setIsLoading(true);
      apiResponseReceived.current = false;
      loadingStartTime.current = Date.now();
      
      // Start progress bar animation (5 seconds to match minimum loading time)
      loadingProgress.setValue(0);
      Animated.timing(loadingProgress, {
        toValue: 1,
        duration: MINIMUM_LOADING_TIME,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
      
      // QR code contains the builder ID, construct the API URL
      const builderId = qrCodeData.trim();
      const apiUrl = `https://apivcb.cometchat.io/v1/builders/${builderId}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: ConfigData = await response.json();
      await saveConfigToStorage(data);
      
      apiResponseReceived.current = true;
      
      const elapsedTime = Date.now() - loadingStartTime.current;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);
      
      setTimeout(() => {
        finishLoading();
      }, remainingTime);
      
      return data;
    } catch (error) {
      console.error('Error fetching data from API:', error);
      Alert.alert(
        'Error',
        `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsLoading(false);
              setScannedCode(null);
              apiResponseReceived.current = false;
            }
          }
        ]
      );
    }
  };



  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Loading camera...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>No camera permission</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isLoading}
        codeScanner={codeScanner}
        torch={isFlashOn ? 'on' : 'off'}
      />
      
      {/* Top Overlay */}
      <View style={styles.topOverlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          
         <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Flash color={'#FFFFFF'} width={24} height={24} />
        </TouchableOpacity>

        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Scan to Preview Your Chat UI</Text>
          <Text style={styles.subtitle}>
            Instantly load and test your configuration{'\n'}from the Visual builder.
          </Text>
        </View>
      </View>

      {/* Simple full overlay approach */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayLeft} />
      <View style={styles.overlayRight} />
      <View style={styles.overlayBottom} />

      {/* Bottom Overlay */}
      <View style={styles.bottomOverlay}>
        {/* Instructions Section */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>How to Use:</Text>
          
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepText}>Go to the Visual builder & generate QR code.</Text>
          </View>
          
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepText}>Point your camera at the QR code to scan.</Text>
          </View>
          
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepText}>Preview your design live on this device instantly.</Text>
          </View>

          {/* Note Section */}
          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>Note:</Text>
            <Text style={styles.noteText}>
              Make sure to save changes on the builder before scanning again to view updates.
            </Text>
          </View>
        </View>
      </View>

      {/* Camera Container Border */}
      
      <View style={styles.cameraBorder}>
        <Animated.View
          style={[
            styles.animatedLine,
            {
              transform: [
                {
                  translateY: lineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 370], 
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Image 
              source={sync} 
              style={styles.syncImage}
              resizeMode="contain"
            />
            <Text style={styles.loadingText}>Syncing with Visual Builder...</Text>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  {
                    width: loadingProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* Scanned Code Display */}
      {scannedCode && !isLoading && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Scanned:</Text>
          <Text style={styles.resultText} numberOfLines={2}>
            {scannedCode}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' ,
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'black'
  },
  centerText: {
    color: 'white',
    fontSize: 16,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 3,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1,
  },
  overlayLeft: {
    position: 'absolute',
    top: 180,
    left: 0,
    width: 20,
    height: 370,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1,
  },
  overlayRight: {
    position: 'absolute',
    top: 180,
    right: 0,
    width: 20,
    height: 370,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1,
  },
  overlayBottom: {
    position: 'absolute',
    top: 550,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1,
  },
  animatedLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 560,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 3,
  },
  cameraBorder: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    height: 370,
    zIndex: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  flashButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashIcon: {
    fontSize: 24,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  instructionsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  noteSection: {
    backgroundColor: '#0B7BEA33',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
  },
  noteTitle: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  resultBox: {
    position: 'absolute',
    bottom: 130,
    alignSelf: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#6366f1',
    zIndex: 2,
  },
  resultLabel: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultText: { 
    color: 'white', 
    fontSize: 14 
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  syncImage: {
    width: 300,
    height: 455,
    marginBottom: 24,
  },
  loadingText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  progressBarContainer: {
    width: 280,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
});

export default QRScreen;