import React, { useState } from 'react';
import map from '../images/map.png';
import fill_in_blank from '../images/fill_in_blank.png';
import fill_in_blank2 from '../images/fill_in_blank2.png';
import three from '../images/two-three.png';
import one from '../images/multiple_choice.png';

const TestDetailsDialog = ({ isOpen, onClose, testData, examId, currentStep }) => {
  const [activeTab, setActiveTab] = useState('one_option');
  
  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'one_option':
        return (
          <div className="space-y-4">
            <div className="flex justify-center">
            <img 
                src={one} 
                alt="Multiple Choice Example" 
                className="max-w-full h-auto rounded-md shadow-md border border-gray-200"
              />
            </div>
            <p className="text-gray-600 text-sm mt-2 text-center">
              Số câu hỏi phải được tô đen bằng lệnh Bold như trong word<br/>
              Các đáp án A,B,C,... phải được thay thế bằng các ô tròn như trong ảnh
            </p>
          </div>
        );
      case 'map':
        return (
          <div className="space-y-4">
            <div className="flex flex-row items-center gap-6">
              <div className="w-1/3">
                <p className="text-gray-600 text-sm">
                  Map cần phải tạo số input tương ứng với số câu hỏi, Các số thứ tự phải được tô đen bằng lệnh Bold như trong word và có "........" phía sau Ví dụ: <br/>
                  14 ....... <br/>
                  15 ....... <br/>
                  16 ....... <br/>
                  17 ....... <br/>
                  18 ....... <br/>
                </p>
              </div>
              <div className="w-2/3 flex justify-center">
                <img 
                  src={map} 
                  alt="Map Example" 
                  className="max-w-full h-auto rounded-md shadow-md border border-gray-200"
                />
              </div>
            </div>
          </div>
        );

      case 'fill_in_the_blanks':
        return (
          <div className="space-y-4">
             <p className="text-gray-600 text-sm mt-2 text-center">
              Các số thứ tự phải được tô đen bằng lệnh Bold như trong word và có "........" phía sau
            </p>
            <div className="flex flex-col justify-center gap-4">
              <img 
                src={fill_in_blank} 
                alt="Fill in the blanks example 1" 
                className="max-w-full h-auto rounded-md shadow-md border border-gray-200"
              />
              <img 
                src={fill_in_blank2} 
                alt="Fill in the blanks example 2" 
                className="max-w-full h-auto rounded-md shadow-md border border-gray-200"
              />
            </div>
          </div>
        );
        case 'three_options':
            return (
              <div className="space-y-4">
                <div className="flex justify-center">
                <img 
                    src={three} 
                    alt="Multiple Choice Example" 
                    className="max-w-full h-auto rounded-md shadow-md border border-gray-200"
                  />
                </div>
                <p className="text-gray-600 text-sm mt-2 text-center">
                  Số câu hỏi phải được tô đen bằng lệnh Bold như trong word. Ví dụ "Question 19 - 20" <br/>
                  Chữ "THREE" phải được tô đen bằng lệnh Bold như trong word <br/>
                  Các đáp án A,B,C,... phải được thay thế bằng các ô vuông như trong ảnh
                </p>
              </div>
            );
            case 'two_options':
                return (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                    <img 
                        src={three} 
                        alt="Multiple Choice Example" 
                        className="max-w-full h-auto rounded-md shadow-md border border-gray-200"
                      />
                    </div>
                    <p className="text-gray-600 text-sm mt-2 text-center">
                    Số câu hỏi phải được tô đen bằng lệnh Bold như trong word. Ví dụ "Question 19 - 20" <br/>
                    Chữ "TWO" phải được tô đen bằng lệnh Bold như trong word <br/>
                    Các đáp án A,B,C,... phải được thay thế bằng các ô vuông như trong ảnh
                    </p>
                  </div>
                );
      default:
        return renderTabContent('one_option');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Test Information</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('one_option')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'one_option' 
                  ? 'text-violet-600 border-b-2 border-violet-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              One option
            </button>
            <button
              onClick={() => setActiveTab('two_options')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'two_options' 
                  ? 'text-violet-600 border-b-2 border-violet-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Two options
            </button>
            <button
              onClick={() => setActiveTab('three_options')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'three_options' 
                  ? 'text-violet-600 border-b-2 border-violet-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Three options
            </button>
            <button
              onClick={() => setActiveTab('fill_in_the_blanks')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'fill_in_the_blanks' 
                  ? 'text-violet-600 border-b-2 border-violet-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Fill in the blanks
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'map' 
                  ? 'text-violet-600 border-b-2 border-violet-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Map
            </button>
          </nav>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {renderTabContent()}
        </div>
        
        <div className="p-4 border-t flex justify-end mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestDetailsDialog;