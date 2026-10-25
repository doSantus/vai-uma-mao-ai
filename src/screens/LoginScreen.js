import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { errorMessage } from '../services/errors';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';

export default function LoginScreen() {
  const { signIn, signUp, verifyEmail, resendCode, recoverPassword, verifyRecovery, googleAvailable, signInWithGoogle } = useData();
  const [mode,setMode] = useState('login');
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [code,setCode] = useState('');
  const [verification,setVerification] = useState(null);
  const [errors,setErrors] = useState({});
  const [busy,setBusy] = useState(false);
  const [resendAt,setResendAt] = useState(0);
  const [seconds,setSeconds] = useState(0);
  const pending = useRef(false);
  useEffect(() => {
    if (!verification) return;
    const update = () => setSeconds(Math.max(0,Math.ceil((resendAt-Date.now())/1000)));
    update(); const timer=setInterval(update,1000); return () => clearInterval(timer);
  },[verification,resendAt]);
  function cooldown() { setResendAt(Date.now()+60000); setSeconds(60); }
  async function run(action) {
    if (pending.current) return;
    pending.current=true; setBusy(true); setErrors({});
    try { await action(); }
    catch(error) {
      if(error.code==='email_not_confirmed') { setVerification('signup'); setPassword(''); }
      setErrors({ general:errorMessage(error) });
    } finally { pending.current=false; setBusy(false); }
  }
  function submit() {
    const next={};
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email='Informe um e-mail válido';
    if(mode==='register' && (name.trim().split(/\s+/).length<2 || name.trim().length>100)) next.name='Informe nome e sobrenome (até 100 caracteres)';
    if(mode!=='recover' && !password) next.password='Informe sua senha';
    if(mode==='register' && password.length<8) next.password='Use pelo menos 8 caracteres';
    if(Object.keys(next).length) { setErrors(next); return; }
    run(async () => {
      if(mode==='login') await signIn({email,password});
      else if(mode==='register') {
        await signUp({email,password,name}); setPassword(''); setCode(''); setVerification('signup'); cooldown();
      } else {
        await recoverPassword(email); setVerification('recovery'); setCode(''); cooldown();
      }
    });
  }
  function confirm() {
    if(!/^\d{4,12}$/.test(code.trim())) { setErrors({code:'Informe o código numérico recebido no e-mail'}); return; }
    run(() => verification==='signup' ? verifyEmail(email,code) : verifyRecovery(email,code));
  }
  function resend() {
    if(Date.now()<resendAt) return;
    run(async () => {
      if(verification==='signup') await resendCode(email); else await recoverPassword(email);
      cooldown(); setCode('');
      Alert.alert('Solicitação recebida','Se o endereço estiver apto, você receberá um novo código. Confira também a caixa de spam.');
    });
  }
  const changeMode=(value)=>{setMode(value);setErrors({});setPassword('');};
  return <Screen scroll>
    <View style={styles.header}>
      <Ionicons name={verification ? 'mail-outline' : 'hand-left'} size={48} color={colors.primary}/>
      <Text style={styles.title}>{verification ? 'Confira seu e-mail' : mode==='recover' ? 'Recuperar senha' : 'Vai uma mão ai'}</Text>
      <Text style={styles.subtitle}>{verification ? email.trim() : 'Encontre ou divulgue serviços na sua cidade'}</Text>
    </View>
    {verification ? <>
      <Text style={styles.subtitle}>Digite o código recebido por e-mail. Se ele expirou, solicite outro. Confira a caixa de spam.</Text>
      <Input label="Código de confirmação" keyboardType="number-pad" autoComplete="one-time-code" value={code} onChangeText={setCode} maxLength={12} editable={!busy} error={errors.code}/>
      {!!errors.general && <Text accessibilityRole="alert" style={styles.error}>{errors.general}</Text>}
      <Button title="Confirmar código" loading={busy} onPress={confirm}/>
      <Button title={seconds ? `Reenviar em ${seconds}s` : 'Reenviar código'} variant="ghost" disabled={busy||seconds>0} onPress={resend}/>
      <Button title="Voltar e corrigir e-mail" variant="outline" disabled={busy} onPress={()=>{setVerification(null);setCode('');setErrors({});}}/>
    </> : <>
      {mode!=='recover' && <View style={styles.tabs}>
        <View style={styles.tab}><Button title="Entrar" variant={mode==='login'?'primary':'ghost'} disabled={busy} onPress={()=>changeMode('login')}/></View>
        <View style={styles.tab}><Button title="Cadastrar" variant={mode==='register'?'primary':'ghost'} disabled={busy} onPress={()=>changeMode('register')}/></View>
      </View>}
      {mode==='register' && <Input label="Nome completo" value={name} onChangeText={setName} autoCapitalize="words" maxLength={100} editable={!busy} error={errors.name}/>}
      <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy} error={errors.email}/>
      {mode!=='recover' && <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry editable={!busy} error={errors.password}/>}
      {!!errors.general && <Text accessibilityRole="alert" style={styles.error}>{errors.general}</Text>}
      <Button title={mode==='login'?'Entrar':mode==='register'?'Criar conta':'Enviar código de recuperação'} loading={busy} onPress={submit}/>
      {mode==='login' && <Button title="Esqueci minha senha" variant="ghost" disabled={busy} onPress={()=>changeMode('recover')}/>}
      {mode==='recover' ? <Button title="Voltar para entrar" variant="ghost" disabled={busy} onPress={()=>changeMode('login')}/> : <>
        <Button title="Continuar com Google" variant="outline" disabled={busy||!googleAvailable} onPress={()=>run(signInWithGoogle)} style={styles.button}/>
        {!googleAvailable && <Text style={styles.note}>Google ainda não está disponível nesta instalação. Você pode entrar com e-mail e senha.</Text>}
      </>}
    </>}
  </Screen>;
}
const styles=StyleSheet.create({
  header:{alignItems:'center',marginTop:spacing.xl,marginBottom:spacing.lg},
  title:{...typography.h2,color:colors.text,textAlign:'center',marginTop:spacing.sm},
  subtitle:{...typography.body,color:colors.textSecondary,textAlign:'center',marginVertical:spacing.sm},
  tabs:{flexDirection:'row',gap:spacing.sm,marginBottom:spacing.lg},tab:{flex:1},
  button:{marginTop:spacing.md},error:{...typography.body,color:colors.error,marginBottom:spacing.md},
  note:{...typography.small,color:colors.textSecondary,textAlign:'center',marginVertical:spacing.md},
});
