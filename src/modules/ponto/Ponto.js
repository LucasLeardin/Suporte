import React, { useState, useEffect, useRef } from 'react';

const Ponto = ({ currentUser }) => {
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [pontos, setPontos] = useState([]);
  const [pontoAtual, setPontoAtual] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualEntrada, setManualEntrada] = useState('');
  const [manualSaida, setManualSaida] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Horários padrão da empresa
  const horariosPadrao = {
    'monday': { entrada: '07:30', almoco: '12:00', retorno: '13:00', saida: '17:30' },
    'tuesday': { entrada: '07:30', almoco: '12:00', retorno: '13:00', saida: '17:30' },
    'wednesday': { entrada: '07:30', almoco: '12:00', retorno: '13:00', saida: '17:30' },
    'thursday': { entrada: '07:30', almoco: '12:00', retorno: '13:00', saida: '17:30' },
    'friday': { entrada: '08:00', almoco: '12:00', retorno: '13:00', saida: '17:00' },
    'saturday': null,
    'sunday': null
  };

  // Atualiza o relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carrega pontos do localStorage
  useEffect(() => {
    const pontosStorage = localStorage.getItem(`pontos_${currentUser.username}`);
    if (pontosStorage) {
      const pontosParsed = JSON.parse(pontosStorage);
      setPontos(pontosParsed);
      
      // Verifica se há um ponto em aberto
      const pontoAberto = pontosParsed.find(p => p.entrada && !p.saida);
      if (pontoAberto) {
        setPontoAtual(pontoAberto);
      }
    }
  }, [currentUser.username]);

  const salvarPontos = (novosPontos) => {
    localStorage.setItem(`pontos_${currentUser.username}`, JSON.stringify(novosPontos));
    setPontos(novosPontos);
  };

  const getDiaSemana = (data) => {
    const dias = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dias[new Date(data).getDay()];
  };

  const getHorarioPadrao = (data) => {
    const diaSemana = getDiaSemana(data);
    return horariosPadrao[diaSemana];
  };

  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calcularHorasTrabalhadas = (entrada, saida) => {
    if (!entrada || !saida) return 0;
    
    const minutosEntrada = timeToMinutes(entrada);
    const minutosSaida = timeToMinutes(saida);
    
    let totalMinutos = minutosSaida - minutosEntrada;
    
    // Descontar 1 hora de almoço se trabalhou mais de 6 horas
    if (totalMinutos > 360) { // 6 horas = 360 minutos
      totalMinutos -= 60; // Descontar 1 hora de almoço
    }
    
    return totalMinutos;
  };

  const calcularHorasExtras = (minutosTrabalhadosRealTime, data) => {
    const horarioPadrao = getHorarioPadrao(data);
    if (!horarioPadrao) return 0; // Fim de semana
    
    const horasEsperadas = timeToMinutes(horarioPadrao.saida) - timeToMinutes(horarioPadrao.entrada) - 60; // 60 min de almoço
    
    return Math.max(0, minutosTrabalhadosRealTime - horasEsperadas);
  };

  const calcularHorasAPagar = (minutosTrabalhadosRealTime, data) => {
    const horarioPadrao = getHorarioPadrao(data);
    if (!horarioPadrao) return 0; // Fim de semana
    
    const horasEsperadas = timeToMinutes(horarioPadrao.saida) - timeToMinutes(horarioPadrao.entrada) - 60; // 60 min de almoço
    
    return Math.max(0, horasEsperadas - minutosTrabalhadosRealTime);
  };

  const getResumoMensal = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const pontosMesAtual = pontos.filter(ponto => {
      const dataPonto = new Date(ponto.data);
      return dataPonto.getMonth() === mesAtual && dataPonto.getFullYear() === anoAtual;
    });
    
    let totalMinutosTrabalhados = 0;
    let totalMinutosExtras = 0;
    let totalMinutosAPagar = 0;
    let diasTrabalhados = 0;
    
    pontosMesAtual.forEach(ponto => {
      if (ponto.entrada && ponto.saida) {
        const minutosTrabalhadosRealTime = calcularHorasTrabalhadas(ponto.entrada, ponto.saida);
        totalMinutosTrabalhados += minutosTrabalhadosRealTime;
        
        const horasExtras = calcularHorasExtras(minutosTrabalhadosRealTime, ponto.data);
        totalMinutosExtras += horasExtras;
        
        const horasAPagar = calcularHorasAPagar(minutosTrabalhadosRealTime, ponto.data);
        totalMinutosAPagar += horasAPagar;
        
        diasTrabalhados++;
      }
    });
    
    return {
      totalHoras: minutesToTime(totalMinutosTrabalhados),
      horasExtras: minutesToTime(totalMinutosExtras),
      horasAPagar: minutesToTime(totalMinutosAPagar),
      diasTrabalhados
    };
  };

  const baterPonto = () => {
    const agora = new Date();
    const dataHoje = agora.toISOString().split('T')[0];
    const horaAgora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (!pontoAtual) {
      // Registrar entrada
      const novoPonto = {
        id: Date.now(),
        data: dataHoje,
        entrada: horaAgora,
        saida: null,
        usuario: currentUser.username,
        tipo: 'normal'
      };
      
      const novosPontos = [...pontos, novoPonto];
      salvarPontos(novosPontos);
      setPontoAtual(novoPonto);
      
      alert(`Entrada registrada às ${horaAgora}`);
    } else {
      // Registrar saída
      const pontosAtualizados = pontos.map(p => 
        p.id === pontoAtual.id 
          ? { ...p, saida: horaAgora }
          : p
      );
      
      salvarPontos(pontosAtualizados);
      setPontoAtual(null);
      
      alert(`Saída registrada às ${horaAgora}`);
    }
  };

  const adicionarPontoManual = () => {
    if (!manualDate || !manualEntrada || !manualSaida) {
      alert('Preencha todos os campos');
      return;
    }

    const novoPonto = {
      id: Date.now(),
      data: manualDate,
      entrada: manualEntrada,
      saida: manualSaida,
      usuario: currentUser.username,
      tipo: 'manual'
    };

    const novosPontos = [...pontos, novoPonto];
    salvarPontos(novosPontos);
    
    // Limpar campos
    setManualDate('');
    setManualEntrada('');
    setManualSaida('');
    setShowManualEntry(false);
    
    alert('Ponto manual adicionado com sucesso!');
  };

  const formatarMinutosParaHoras = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  };

  const getStatusDia = (ponto) => {
    if (!ponto.entrada || !ponto.saida) return 'Em andamento';
    
    const minutosTrabalhadosRealTime = calcularHorasTrabalhadas(ponto.entrada, ponto.saida);
    const horasExtras = calcularHorasExtras(minutosTrabalhadosRealTime, ponto.data);
    const horasAPagar = calcularHorasAPagar(minutosTrabalhadosRealTime, ponto.data);
    
    if (horasExtras > 0) return `Extra: ${formatarMinutosParaHoras(horasExtras)}`;
    if (horasAPagar > 0) return `A pagar: ${formatarMinutosParaHoras(horasAPagar)}`;
    return 'Normal';
  };

  const resumo = getResumoMensal();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '30px', textAlign: 'center', fontSize: '28px' }}>
        ⏰ Sistema de Ponto
      </h2>

      {/* Relógio e Status */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ backgroundColor: '#34495e', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', minWidth: '180px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Horário Atual</h3>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {horaAtual.toLocaleTimeString('pt-BR')}
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
            {horaAtual.toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div style={{ backgroundColor: pontoAtual ? '#27ae60' : '#e74c3c', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', minWidth: '180px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Status</h3>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {pontoAtual ? 'TRABALHANDO' : 'FORA DO EXPEDIENTE'}
          </div>
          {pontoAtual && (
            <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
              Entrada: {pontoAtual.entrada}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#3498db', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', minWidth: '180px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Horário Padrão Hoje</h3>
          {(() => {
            const horarioPadrao = getHorarioPadrao(new Date().toISOString().split('T')[0]);
            return horarioPadrao ? (
              <div style={{ fontSize: '14px' }}>
                {horarioPadrao.entrada} - {horarioPadrao.saida}
              </div>
            ) : (
              <div style={{ fontSize: '14px' }}>Fim de semana</div>
            );
          })()}
        </div>
      </div>

      {/* Botões de Ação */}
      <div style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={baterPonto}
          style={{
            backgroundColor: pontoAtual ? '#e74c3c' : '#27ae60',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {pontoAtual ? 'REGISTRAR SAÍDA' : 'REGISTRAR ENTRADA'}
        </button>

        <button
          onClick={() => setShowManualEntry(!showManualEntry)}
          style={{
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          LANÇAR MANUAL
        </button>

        <button
          onClick={() => setShowSummary(!showSummary)}
          style={{
            backgroundColor: '#9b59b6',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          RESUMO MENSAL
        </button>
      </div>

      {/* Formulário de Lançamento Manual */}
      {showManualEntry && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Lançar Ponto Manual</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Data:</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Entrada:</label>
              <input
                type="time"
                value={manualEntrada}
                onChange={(e) => setManualEntrada(e.target.value)}
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Saída:</label>
              <input
                type="time"
                value={manualSaida}
                onChange={(e) => setManualSaida(e.target.value)}
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
            </div>
            <button
              onClick={adicionarPontoManual}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Resumo Mensal */}
      {showSummary && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ddd' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Resumo do Mês</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#3498db', color: 'white', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{resumo.totalHoras}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Trabalhado</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#27ae60', color: 'white', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{resumo.horasExtras}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Horas Extras</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e74c3c', color: 'white', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{resumo.horasAPagar}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Horas a Pagar</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f39c12', color: 'white', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{resumo.diasTrabalhados}</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Dias Trabalhados</div>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Pontos */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>
          📋 Histórico de Pontos
        </h3>

        {pontos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '16px', padding: '20px' }}>
            Nenhum ponto registrado ainda.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #bdc3c7' }}>Data</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #bdc3c7' }}>Entrada</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #bdc3c7' }}>Saída</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #bdc3c7' }}>Horas</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #bdc3c7' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #bdc3c7' }}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {pontos.slice().reverse().map((ponto) => (
                  <tr key={ponto.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ecf0f1' }}>
                      {new Date(ponto.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ecf0f1' }}>
                      {ponto.entrada}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ecf0f1' }}>
                      {ponto.saida || <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Em andamento</span>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ecf0f1' }}>
                      {ponto.entrada && ponto.saida ? formatarMinutosParaHoras(calcularHorasTrabalhadas(ponto.entrada, ponto.saida)) : '---'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ecf0f1' }}>
                      {getStatusDia(ponto)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ecf0f1' }}>
                      {ponto.tipo === 'manual' ? '✍️' : '🤖'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ponto;
